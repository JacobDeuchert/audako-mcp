import { EntityType } from 'audako-core';
import { audakoServices } from './audako-services.js';
import type { PermissionContextEntry } from './mutation-permissions.js';

export type MutationScopeBlockReason =
  | 'missing_context_group'
  | 'missing_target_group'
  | 'outside_context_group'
  | 'target_group_lookup_failed';

interface MutationScopeInput {
  contextGroupId?: string;
  targetGroupId?: string;
}

interface MutationScopeAllowedResult {
  allowed: true;
  contextGroupId: string;
  targetGroupId: string;
  targetGroupPath: string[];
  targetGroupLabel?: string;
}

interface MutationScopeBlockedResult {
  allowed: false;
  reason: MutationScopeBlockReason;
  contextGroupId?: string;
  targetGroupId?: string;
  targetGroupPath?: string[];
  targetGroupLabel?: string;
}

export type MutationScopeResult = MutationScopeAllowedResult | MutationScopeBlockedResult;

export interface OutOfContextMutationErrorPayload {
  errorCode: 'OUT_OF_CONTEXT_MUTATION';
  message: string;
  requiredAction: 'user_confirmation_required';
  reason: MutationScopeBlockReason;
  tool: string;
  nextAction: 'retry_with_permission_mode_interactive_or_change_context';
  permissionMode: 'fail_fast';
  permissionRequest: {
    tool: string;
    context: PermissionContextEntry[];
    entityType: string;
    entityId?: string;
    entityName?: string;
    targetGroupId?: string;
    targetGroupLabel?: string;
    reason: MutationScopeBlockReason;
  };
}

function toOptionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeGroupPath(pathValue: unknown, targetGroupId: string): string[] {
  const normalizedPath = Array.isArray(pathValue)
    ? pathValue
        .filter((pathId): pathId is string => typeof pathId === 'string')
        .map(pathId => pathId.trim())
        .filter(pathId => pathId.length > 0)
    : [];

  if (normalizedPath[normalizedPath.length - 1] !== targetGroupId) {
    normalizedPath.push(targetGroupId);
  }

  return normalizedPath;
}

function resolveFieldValueString(value: unknown): string | undefined {
  const direct = toOptionalTrimmedString(value);
  if (direct) {
    return direct;
  }

  if (typeof value === 'object' && value !== null && 'Value' in value) {
    return toOptionalTrimmedString((value as { Value?: unknown }).Value);
  }

  return undefined;
}

function normalizeScopeInput(input: MutationScopeInput): MutationScopeInput {
  return {
    contextGroupId: toOptionalTrimmedString(input.contextGroupId),
    targetGroupId: toOptionalTrimmedString(input.targetGroupId),
  };
}

export async function evaluateMutationScope(
  input: MutationScopeInput,
): Promise<MutationScopeResult> {
  const normalized = normalizeScopeInput(input);

  if (!normalized.contextGroupId) {
    return {
      allowed: false,
      reason: 'missing_context_group',
      targetGroupId: normalized.targetGroupId,
    };
  }

  if (!normalized.targetGroupId) {
    return {
      allowed: false,
      reason: 'missing_target_group',
      contextGroupId: normalized.contextGroupId,
    };
  }

  try {
    const targetGroup = await audakoServices.entityService.getPartialEntityById<any>(
      EntityType.Group,
      normalized.targetGroupId,
      {
        Name: 1,
        Path: 1,
      },
    );

    const targetGroupPath = normalizeGroupPath(targetGroup?.Path, normalized.targetGroupId);
    const targetGroupLabel = resolveFieldValueString(targetGroup?.Name);
    const inScope = targetGroupPath.includes(normalized.contextGroupId);

    if (inScope) {
      return {
        allowed: true,
        contextGroupId: normalized.contextGroupId,
        targetGroupId: normalized.targetGroupId,
        targetGroupPath,
        targetGroupLabel,
      };
    }

    return {
      allowed: false,
      reason: 'outside_context_group',
      contextGroupId: normalized.contextGroupId,
      targetGroupId: normalized.targetGroupId,
      targetGroupPath,
      targetGroupLabel,
    };
  } catch {
    return {
      allowed: false,
      reason: 'target_group_lookup_failed',
      contextGroupId: normalized.contextGroupId,
      targetGroupId: normalized.targetGroupId,
    };
  }
}

export function buildOutOfContextMutationErrorPayload(input: {
  tool: string;
  reason: MutationScopeBlockReason;
  entityType: string;
  entityId?: string;
  entityName?: string;
  targetGroupId?: string;
  targetGroupLabel?: string;
}): OutOfContextMutationErrorPayload {
  const tool = input.tool.trim();
  const entityType = input.entityType.trim();
  const entityId = toOptionalTrimmedString(input.entityId);
  const entityName = toOptionalTrimmedString(input.entityName);
  const targetGroupId = toOptionalTrimmedString(input.targetGroupId);
  const targetGroupLabel = toOptionalTrimmedString(input.targetGroupLabel);

  const context: PermissionContextEntry[] = [];
  if (targetGroupId) {
    context.push({ key: 'groupId', value: targetGroupId });
  }

  return {
    errorCode: 'OUT_OF_CONTEXT_MUTATION',
    message:
      'Mutation target is outside current context group and interactive permission prompting is disabled (permissionMode=fail_fast).',
    requiredAction: 'user_confirmation_required',
    tool,
    reason: input.reason,
    nextAction: 'retry_with_permission_mode_interactive_or_change_context',
    permissionMode: 'fail_fast',
    permissionRequest: {
      tool,
      context,
      entityType,
      entityId,
      entityName,
      targetGroupId,
      targetGroupLabel,
      reason: input.reason,
    },
  };
}
