import type { QuestionRequest } from '@audako/contracts';
import { EntityType } from 'audako-core';
import { createLogger } from '../config/app-config.js';
import type { AudakoServices } from './audako-services.js';
import type { SessionRegistry } from './session-registry.js';
import type { ToolRequestHub } from './tool-request-hub.js';

const logger = createLogger('permission-service');

export type PermissionMode = 'interactive' | 'fail_fast';

export function normalizePermissionMode(mode: unknown): PermissionMode {
  return mode === 'fail_fast' ? 'fail_fast' : 'interactive';
}

export interface PermissionService {
  hasPermission(
    sessionId: string,
    entityType: string,
    requestedGroupId: string | undefined,
    permissionMode: PermissionMode,
    tool: string,
  ): Promise<boolean>;
}

const ALLOW_OPTION = 'Allow';
const DENY_OPTION = 'Deny';

function isAllowDecision(response: unknown): boolean {
  if (typeof response === 'string') {
    return response.trim() === ALLOW_OPTION;
  }
  if (!Array.isArray(response)) {
    return false;
  }
  return response.some(choice => typeof choice === 'string' && choice.trim() === ALLOW_OPTION);
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

export class DefaultPermissionService implements PermissionService {
  private readonly grants = new Map<string, Set<string>>();

  constructor(
    private readonly sessionRegistry: SessionRegistry,
    private readonly toolRequestHub: ToolRequestHub,
  ) {}

  async hasPermission(
    sessionId: string,
    entityType: string,
    requestedGroupId: string | undefined,
    permissionMode: PermissionMode,
    tool: string,
  ): Promise<boolean> {
    const session = this.sessionRegistry.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const contextGroupId = session.sessionContext.groupId;

    if (!requestedGroupId || !contextGroupId) {
      return true;
    }

    const inScope = await this.isGroupInScope(
      session.audakoServices.entityService,
      contextGroupId,
      requestedGroupId,
    );

    if (inScope) {
      return true;
    }

    const grantKey = `${tool}:${entityType}:${requestedGroupId}`;
    const sessionGrants = this.grants.get(sessionId);
    if (sessionGrants?.has(grantKey)) {
      return true;
    }

    if (permissionMode === 'fail_fast') {
      throw new Error(
        `Mutation blocked: ${tool} targets ${entityType} in group ${requestedGroupId} which is outside the current context group. Use permissionMode 'interactive' to prompt the user.`,
      );
    }

    const question: QuestionRequest = {
      text: `The ${tool} operation targets ${entityType} in group ${requestedGroupId} which is outside your current context group. Allow this operation?`,
      header: 'Out-of-Scope Permission',
      options: [
        {
          label: ALLOW_OPTION,
          description: 'Allow this operation outside the current context group.',
        },
        { label: DENY_OPTION, description: 'Block this operation.' },
      ],
    };

    let response: unknown;
    try {
      response = await this.toolRequestHub.create(sessionId, question);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Permission request failed for ${tool} on ${entityType}: ${message}`);
    }

    if (!isAllowDecision(response)) {
      throw new Error(
        `Mutation blocked: user denied ${tool} on ${entityType} in group ${requestedGroupId}.`,
      );
    }

    if (!this.grants.has(sessionId)) {
      this.grants.set(sessionId, new Set());
    }
    this.grants.get(sessionId)?.add(grantKey);

    logger.info(
      { sessionId, entityType, requestedGroupId, tool },
      'Out-of-scope permission granted by user',
    );

    return true;
  }

  private async isGroupInScope(
    entityService: AudakoServices['entityService'],
    contextGroupId: string,
    targetGroupId: string,
  ): Promise<boolean> {
    try {
      const targetGroup = await entityService.getPartialEntityById(
        EntityType.Group,
        targetGroupId,
        {
          Path: 1,
        },
      );
      const pathIds = normalizeGroupPath(targetGroup?.Path, targetGroupId);
      return pathIds.includes(contextGroupId);
    } catch {
      return false;
    }
  }

  clearSession(sessionId: string): void {
    this.grants.delete(sessionId);
  }
}
