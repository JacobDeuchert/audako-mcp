import {
  grantSessionPermission,
  type PermissionContextEntry,
  userHasPermission,
} from './mutation-permissions.js';
import type {
  MutationScopeBlockReason,
  OutOfContextMutationErrorPayload,
} from './mutation-scope-guard.js';
import { buildOutOfContextMutationErrorPayload } from './mutation-scope-guard.js';
import { requestQuestionAnswer } from './session-events.js';

export type PermissionMode = 'interactive' | 'fail_fast';
export type PermissionGrantedDecision = 'allow_once' | 'allow_session' | 'allow_session_existing';
type PermissionDecision = PermissionGrantedDecision | 'denied';

export interface PermissionResultMetadata {
  prompted: boolean;
  mode: PermissionMode;
  decision: PermissionGrantedDecision;
}

interface PermissionDeniedPayload {
  errorCode: 'PERMISSION_DENIED';
  message: string;
  tool: string;
  permission: {
    prompted: true;
    mode: PermissionMode;
    decision: 'denied';
  };
}

type OutOfContextPermissionBlockedPayload =
  | (OutOfContextMutationErrorPayload & {
      permission: {
        prompted: false;
        mode: PermissionMode;
      };
    })
  | PermissionDeniedPayload;

export type OutOfContextPermissionResult =
  | {
      allowed: true;
      permission: PermissionResultMetadata;
    }
  | {
      allowed: false;
      payload: OutOfContextPermissionBlockedPayload;
    };

interface ResolveOutOfContextPermissionInput {
  toolName: string;
  mode: PermissionMode;
  reason: MutationScopeBlockReason;
  context: PermissionContextEntry[];
  entityType: string;
  entityId?: string;
  entityName?: string;
  targetGroupId: string;
  targetGroupLabel?: string;
}

function toOptionalTrimmedString(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveActionLabels(toolName: string): {
  verb: string;
  pluralVerb: string;
} {
  if (toolName === 'update-entity') {
    return {
      verb: 'edit',
      pluralVerb: 'edits',
    };
  }

  if (toolName === 'create-entity') {
    return {
      verb: 'create',
      pluralVerb: 'creates',
    };
  }

  if (toolName === 'move-entity') {
    return {
      verb: 'move',
      pluralVerb: 'moves',
    };
  }

  return {
    verb: 'modify',
    pluralVerb: 'changes',
  };
}

function resolveQuestionText(input: {
  toolName: string;
  entityType: string;
  entityName?: string;
  targetGroupId: string;
  targetGroupLabel?: string;
}): string {
  const { verb } = resolveActionLabels(input.toolName);
  const entityLabel = input.entityName
    ? `${input.entityType} "${input.entityName}"`
    : input.entityType;
  const groupLabel = input.targetGroupLabel ?? input.targetGroupId;
  return `Allow to ${verb} ${entityLabel} in group "${groupLabel}"?`;
}

async function requestInlinePermissionDecision(input: {
  toolName: string;
  entityType: string;
  entityName?: string;
  targetGroupId: string;
  targetGroupLabel?: string;
}): Promise<PermissionDecision> {
  const groupLabel = input.targetGroupLabel ?? input.targetGroupId;
  const { pluralVerb } = resolveActionLabels(input.toolName);
  const allowOnceLabel = 'Allow';
  const allowSessionLabel = `Allow all ${input.entityType} ${pluralVerb} in ${groupLabel}`;
  const denyLabel = 'Deny';

  const answers = await requestQuestionAnswer({
    text: resolveQuestionText(input),
    header: 'Mutation Permission',
    options: [
      {
        label: allowOnceLabel,
        description: 'Allow this action once.',
      },
      {
        label: allowSessionLabel,
        description: 'Allow this tool in this context for the rest of this session.',
      },
      {
        label: denyLabel,
        description: 'Deny this action.',
      },
    ],
  });

  const selectedAnswer = answers
    .find(answer => typeof answer === 'string' && answer.trim())
    ?.trim();

  if (selectedAnswer === allowSessionLabel) {
    return 'allow_session';
  }

  if (selectedAnswer === allowOnceLabel) {
    return 'allow_once';
  }

  return 'denied';
}

export function normalizePermissionMode(value: unknown): PermissionMode {
  return value === 'fail_fast' ? 'fail_fast' : 'interactive';
}

export function buildGroupPermissionContext(groupId: string): PermissionContextEntry[] {
  const normalizedGroupId = groupId.trim();
  if (!normalizedGroupId) {
    throw new Error('Permission context groupId must be a non-empty string.');
  }

  return [
    {
      key: 'groupId',
      value: normalizedGroupId,
    },
  ];
}

export async function resolveOutOfContextPermission(
  input: ResolveOutOfContextPermissionInput,
): Promise<OutOfContextPermissionResult> {
  const normalizedToolName = input.toolName.trim();
  const normalizedEntityName = toOptionalTrimmedString(input.entityName);
  const normalizedEntityId = toOptionalTrimmedString(input.entityId);
  const normalizedTargetGroupLabel = toOptionalTrimmedString(input.targetGroupLabel);

  const hasSessionPermission = userHasPermission({
    toolName: normalizedToolName,
    context: input.context,
  });

  if (hasSessionPermission) {
    return {
      allowed: true,
      permission: {
        prompted: false,
        mode: input.mode,
        decision: 'allow_session_existing',
      },
    };
  }

  if (input.mode === 'fail_fast') {
    const payloadOutOfContext = buildOutOfContextMutationErrorPayload({
      tool: normalizedToolName,
      reason: input.reason,
      entityType: input.entityType,
      entityId: normalizedEntityId,
      entityName: normalizedEntityName,
      targetGroupId: input.targetGroupId,
      targetGroupLabel: normalizedTargetGroupLabel,
    });

    return {
      allowed: false,
      payload: {
        ...payloadOutOfContext,
        permission: {
          prompted: false,
          mode: input.mode,
        },
      },
    };
  }

  const decision = await requestInlinePermissionDecision({
    toolName: normalizedToolName,
    entityType: input.entityType,
    entityName: normalizedEntityName,
    targetGroupId: input.targetGroupId,
    targetGroupLabel: normalizedTargetGroupLabel,
  });

  if (decision === 'denied') {
    return {
      allowed: false,
      payload: {
        errorCode: 'PERMISSION_DENIED',
        message: 'User denied out-of-context mutation.',
        tool: normalizedToolName,
        permission: {
          prompted: true,
          mode: input.mode,
          decision,
        },
      },
    };
  }

  if (decision === 'allow_session') {
    grantSessionPermission({
      toolName: normalizedToolName,
      context: input.context,
    });
  }

  return {
    allowed: true,
    permission: {
      prompted: true,
      mode: input.mode,
      decision,
    },
  };
}
