import { describe, expect, it } from 'vitest';
import {
  RealtimeDescriptorSchema,
  SessionBootstrapResponseSchema,
  SessionInfoSnapshotSchema,
} from './copilot.js';
import {
  AssistantDonePayloadSchema,
  ChildTaskAcceptedPayloadSchema,
  ChildTaskCancelledPayloadSchema,
  ChildTaskCompletedPayloadSchema,
  ChildTaskFailedPayloadSchema,
  ChildTaskStartedPayloadSchema,
  CommandAcknowledgementPayloadSchema,
  CopilotV1EventNameSchema,
  CopilotV1EventNames,
  EntityCreatedEventPayloadSchema,
  EntityMovedEventPayloadSchema,
  EntityUpdatedEventPayloadSchema,
  QuestionAskPayloadSchema,
} from './copilot-ws-events.js';
import * as contracts from './index.js';

describe('@audako/contracts - Copilot v1 Socket.IO contracts', () => {
  it('validates bootstrap response with realtime descriptor', () => {
    const payload = {
      sessionId: 'sess_123',
      isNew: true,
      scadaUrl: 'https://scada.example.com',
      sessionInfo: SessionInfoSnapshotSchema.parse({
        tenantId: 'tenant_1',
        groupId: 'group_1',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      realtime: {
        transport: 'socket.io',
        protocolVersion: 'v1',
        namespace: '/session',
        path: '/socket.io',
        auth: {
          type: 'session_token',
          token: 'token_abc',
        },
        room: {
          type: 'session',
          id: 'sess_123',
        },
      },
    };

    const result = SessionBootstrapResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data.realtime.transport).toBe('socket.io');
    expect(result.data.realtime.namespace).toBe('/session');
    expect(result.data.realtime.path).toBe('/socket.io');
    expect(result.data.realtime.auth.token).toBe('token_abc');
  });

  it('rejects legacy bootstrap fields', () => {
    const result = SessionBootstrapResponseSchema.safeParse({
      sessionId: 'sess_123',
      isNew: true,
      scadaUrl: 'https://scada.example.com',
      sessionInfo: {},
      websocketPath: '/api/session/sess_123/ws',
      bridgeSessionToken: 'token_abc',
      realtime: {
        transport: 'socket.io',
        protocolVersion: 'v1',
        namespace: '/session',
        path: '/socket.io',
        auth: {
          type: 'session_token',
          token: 'token_abc',
        },
        room: {
          type: 'session',
          id: 'sess_123',
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it('accepts only approved v1 event names', () => {
    expect(CopilotV1EventNames).toEqual([
      'prompt.send',
      'prompt.cancel',
      'question.answer',
      'session.update',
      'session.snapshot',
      'session.updated',
      'session.closed',
      'assistant.delta',
      'assistant.done',
      'assistant.error',
      'entity.created',
      'entity.updated',
      'entity.moved',
      'child_task.accepted',
      'child_task.started',
      'child_task.completed',
      'child_task.failed',
      'child_task.cancelled',
    ]);

    expect(CopilotV1EventNameSchema.safeParse('hub.request').success).toBe(false);
    expect(CopilotV1EventNameSchema.safeParse('hub.response').success).toBe(false);
    expect(CopilotV1EventNameSchema.safeParse('ping').success).toBe(false);
    expect(CopilotV1EventNameSchema.safeParse('pong').success).toBe(false);
    expect(CopilotV1EventNameSchema.safeParse('agent.tool_start').success).toBe(false);
    expect(CopilotV1EventNameSchema.safeParse('agent.tool_end').success).toBe(false);
    expect(CopilotV1EventNameSchema.safeParse('agent.turn_start').success).toBe(false);
    expect(CopilotV1EventNameSchema.safeParse('agent.turn_end').success).toBe(false);
    expect(CopilotV1EventNameSchema.safeParse('child_session.created').success).toBe(false);
    expect(CopilotV1EventNameSchema.safeParse('child_session.completed').success).toBe(false);
  });

  it('validates command acknowledgement payloads', () => {
    const accepted = CommandAcknowledgementPayloadSchema.safeParse({
      commandId: 'cmd_1',
      command: 'prompt.send',
      status: 'accepted',
      acknowledgedAt: '2026-01-01T00:00:00.000Z',
    });

    const rejected = CommandAcknowledgementPayloadSchema.safeParse({
      commandId: 'cmd_2',
      command: 'session.update',
      status: 'rejected',
      acknowledgedAt: '2026-01-01T00:00:00.000Z',
      error: {
        code: 'INVALID_SESSION_INFO',
        message: 'sessionInfo cannot be empty',
      },
    });

    const invalid = CommandAcknowledgementPayloadSchema.safeParse({
      commandId: 'cmd_3',
      command: 'question.ask',
      status: 'accepted',
      acknowledgedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(accepted.success).toBe(true);
    expect(rejected.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it('requires assistant.done payload with finalText and finishReason', () => {
    const valid = AssistantDonePayloadSchema.safeParse({
      turnId: 'turn_1',
      finalText: 'Done',
      finishReason: 'endTurn',
    });

    const invalid = AssistantDonePayloadSchema.safeParse({
      turnId: 'turn_1',
      finalMessage: 'Done',
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it('validates focused entity action payloads', () => {
    const created = EntityCreatedEventPayloadSchema.safeParse({
      entityType: 'Signal',
      entityId: 'entity_1',
      groupId: 'group_1',
      metadata: {
        tenantId: 'tenant_1',
        sourceTool: 'create-entity',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
      data: {
        name: 'Signal 1',
      },
    });

    const updated = EntityUpdatedEventPayloadSchema.safeParse({
      entityType: 'Signal',
      entityId: 'entity_1',
      groupId: 'group_1',
      changedFields: ['name'],
      changes: {
        name: 'Renamed signal',
      },
      metadata: {
        tenantId: 'tenant_1',
        sourceTool: 'update-entity',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    });

    const moved = EntityMovedEventPayloadSchema.safeParse({
      entityType: 'Signal',
      entityId: 'entity_1',
      sourceGroupId: 'group_1',
      targetGroupId: 'group_2',
      metadata: {
        tenantId: 'tenant_1',
        sourceTool: 'move-entity',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    });

    expect(created.success).toBe(true);
    expect(updated.success).toBe(true);
    expect(moved.success).toBe(true);
  });

  it('validates child_task lifecycle payloads', () => {
    const accepted = ChildTaskAcceptedPayloadSchema.safeParse({
      childSessionId: 'child_sess_1',
      parentSessionId: 'parent_sess_1',
      profileName: 'diagnostics',
      description: 'Run system diagnostics',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    const started = ChildTaskStartedPayloadSchema.safeParse({
      childSessionId: 'child_sess_1',
      parentSessionId: 'parent_sess_1',
      profileName: 'diagnostics',
      startedAt: '2026-01-01T00:00:01.000Z',
    });

    const completed = ChildTaskCompletedPayloadSchema.safeParse({
      childSessionId: 'child_sess_1',
      parentSessionId: 'parent_sess_1',
      profileName: 'diagnostics',
      completedAt: '2026-01-01T00:01:00.000Z',
      result: { status: 'ok' },
    });

    const failed = ChildTaskFailedPayloadSchema.safeParse({
      childSessionId: 'child_sess_1',
      parentSessionId: 'parent_sess_1',
      profileName: 'diagnostics',
      failedAt: '2026-01-01T00:01:00.000Z',
      error: 'Connection timeout',
    });

    const cancelled = ChildTaskCancelledPayloadSchema.safeParse({
      childSessionId: 'child_sess_1',
      parentSessionId: 'parent_sess_1',
      profileName: 'diagnostics',
      cancelledAt: '2026-01-01T00:00:30.000Z',
      reason: 'User cancelled',
    });

    expect(accepted.success).toBe(true);
    expect(started.success).toBe(true);
    expect(completed.success).toBe(true);
    expect(failed.success).toBe(true);
    expect(cancelled.success).toBe(true);
  });

  it('rejects malformed child_task payloads', () => {
    const acceptedMissingFields = ChildTaskAcceptedPayloadSchema.safeParse({
      childSessionId: 'child_sess_1',
    });

    const startedWrongType = ChildTaskStartedPayloadSchema.safeParse({
      childSessionId: 'child_sess_1',
      parentSessionId: 'parent_sess_1',
      profileName: 'diagnostics',
      startedAt: 12345,
    });

    const completedExtraField = ChildTaskCompletedPayloadSchema.safeParse({
      childSessionId: 'child_sess_1',
      parentSessionId: 'parent_sess_1',
      profileName: 'diagnostics',
      completedAt: '2026-01-01T00:01:00.000Z',
      status: 'done',
    });

    const failedMissingError = ChildTaskFailedPayloadSchema.safeParse({
      childSessionId: 'child_sess_1',
      parentSessionId: 'parent_sess_1',
      profileName: 'diagnostics',
      failedAt: '2026-01-01T00:01:00.000Z',
    });

    const cancelledLegacyShape = ChildTaskCancelledPayloadSchema.safeParse({
      sessionId: 'child_sess_1',
      parentId: 'parent_sess_1',
      cancelledAt: '2026-01-01T00:00:30.000Z',
      reason: 'User cancelled',
    });

    expect(acceptedMissingFields.success).toBe(false);
    expect(startedWrongType.success).toBe(false);
    expect(completedExtraField.success).toBe(false);
    expect(failedMissingError.success).toBe(false);
    expect(cancelledLegacyShape.success).toBe(false);
  });

  it('provides question.ask payload schema but no legacy websocket exports', () => {
    const questionAsk = QuestionAskPayloadSchema.safeParse({
      questionId: 'q_1',
      request: {
        text: 'Choose one',
        header: 'Question',
        options: [{ label: 'A', description: 'First option' }],
      },
      expiresAt: '2026-01-01T00:00:00.000Z',
    });

    expect(questionAsk.success).toBe(true);

    expect('BridgeSessionWebSocketPingMessageSchema' in contracts).toBe(false);
    expect('BridgeSessionWebSocketPongMessageSchema' in contracts).toBe(false);
    expect('BridgeSessionWebSocketClientMessageSchema' in contracts).toBe(false);
    expect('createHubRequestPayloadSchema' in contracts).toBe(false);
  });

  it('requires strict realtime descriptor shape', () => {
    const valid = RealtimeDescriptorSchema.safeParse({
      transport: 'socket.io',
      protocolVersion: 'v1',
      namespace: '/session',
      path: '/socket.io',
      auth: {
        type: 'session_token',
        token: 'token_abc',
      },
      room: {
        type: 'session',
        id: 'sess_1',
      },
    });

    const invalid = RealtimeDescriptorSchema.safeParse({
      transport: 'websocket',
      protocolVersion: 'v1',
      namespace: '/session',
      path: '/socket.io',
      auth: {
        type: 'session_token',
        token: 'token_abc',
      },
      room: {
        type: 'session',
        id: 'sess_1',
      },
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
