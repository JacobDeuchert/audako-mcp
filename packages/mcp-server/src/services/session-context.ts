import type { SessionInfoResponse } from '@audako/contracts';
import { EntityType, type Group, type TenantView } from 'audako-core';
import { audakoServices } from './audako-services.js';
import { bridgeWsClient } from './bridge-ws-client.js';
import { logger } from './logger.js';
import { fetchSessionInfo } from './session-info.js';

export interface ResolvedContext {
  tenantId?: string;
  groupId?: string;
  entityType?: string;
  app?: string;
  updatedAt?: string;
  tenantView?: TenantView;
  groupPath?: string[];
}

let currentContext: ResolvedContext | null = null;
let initialContextPromise: Promise<ResolvedContext> | null = null;
let tenantGeneration = 0;
let groupGeneration = 0;

function normalizeGroupPath(pathValue: unknown, groupId: string): string[] {
  const normalizedPath = Array.isArray(pathValue)
    ? pathValue
        .filter((pathId): pathId is string => typeof pathId === 'string')
        .map(pathId => pathId.trim())
        .filter(pathId => pathId.length > 0)
    : [];

  if (normalizedPath[normalizedPath.length - 1] !== groupId) {
    normalizedPath.push(groupId);
  }

  return normalizedPath;
}

async function resolveTenantView(tenantId: string, gen: number): Promise<void> {
  try {
    const tenantView = await audakoServices.tenantService.getTenantViewById(tenantId);
    if (gen < tenantGeneration) {
      return;
    }
    if (currentContext) {
      currentContext.tenantView = tenantView;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logger.warn('session-context: failed to resolve tenantView', {
      tenantId,
      error: message,
    });
  }
}

async function resolveGroupPath(groupId: string, gen: number): Promise<void> {
  try {
    const group = await audakoServices.entityService.getPartialEntityById<Group>(
      EntityType.Group,
      groupId,
      { Path: 1 },
    );
    const groupPath = normalizeGroupPath(group.Path, groupId);
    if (gen < groupGeneration) {
      return;
    }
    if (currentContext) {
      currentContext.groupPath = groupPath;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logger.warn('session-context: failed to resolve groupPath', {
      groupId,
      error: message,
    });
  }
}

export function handleSessionInfo(rawInfo: SessionInfoResponse): void {
  if (
    currentContext?.updatedAt &&
    rawInfo.updatedAt &&
    rawInfo.updatedAt < currentContext.updatedAt
  ) {
    return;
  }

  const prevTenantId = currentContext?.tenantId?.trim();
  const prevGroupId = currentContext?.groupId?.trim();

  if (!currentContext) {
    currentContext = {};
  }

  currentContext.tenantId = rawInfo.tenantId;
  currentContext.groupId = rawInfo.groupId;
  currentContext.entityType = rawInfo.entityType;
  currentContext.app = rawInfo.app;
  currentContext.updatedAt = rawInfo.updatedAt;

  const tenantId = rawInfo.tenantId?.trim();
  const groupId = rawInfo.groupId?.trim();

  if (tenantId !== prevTenantId) {
    if (tenantId) {
      tenantGeneration += 1;
      void resolveTenantView(tenantId, tenantGeneration);
    } else {
      currentContext.tenantView = undefined;
    }
  }

  if (groupId !== prevGroupId) {
    if (groupId) {
      groupGeneration += 1;
      void resolveGroupPath(groupId, groupGeneration);
    } else {
      currentContext.groupPath = undefined;
    }
  }
}

/**
 * Initializes the session context by performing a cold-start HTTP fetch of session info,
 * then registers a WebSocket handler for live updates.
 *
 * Call once at MCP server startup. Idempotent — subsequent calls return the same promise.
 */
export async function initializeContext(): Promise<ResolvedContext> {
  if (initialContextPromise) {
    return initialContextPromise;
  }

  initialContextPromise = (async (): Promise<ResolvedContext> => {
    try {
      const sessionInfo = await fetchSessionInfo();
      handleSessionInfo(sessionInfo);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await logger.warn('session-context: failed to fetch initial session info', {
        error: message,
      });

      if (!currentContext) {
        currentContext = {};
      }
    }

    bridgeWsClient.onSessionInfo(handleSessionInfo);

    return currentContext ?? {};
  })();

  return initialContextPromise;
}

/**
 * Returns the current resolved session context.
 *
 * - If context is already populated (post-init), returns immediately.
 * - If initialization is in progress, waits for it to complete.
 * - If initialization has not started, returns an empty context immediately.
 * - Never throws.
 */
export async function getContext(): Promise<ResolvedContext> {
  if (currentContext !== null) {
    return currentContext;
  }

  if (initialContextPromise !== null) {
    return initialContextPromise;
  }

  return {};
}
