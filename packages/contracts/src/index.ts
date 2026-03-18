export type { ErrorResponse } from './common.js';
export { ErrorResponseSchema, isErrorResponse } from './common.js';

export type {
  RealtimeDescriptor,
  SessionBootstrapRequest,
  SessionBootstrapResponse,
  SessionInfoFields,
  SessionInfoResponse,
  SessionInfoSnapshot,
} from './copilot.js';
export {
  isSessionInfoResponse,
  RealtimeDescriptorSchema,
  SessionBootstrapRequestSchema,
  SessionBootstrapResponseSchema,
  SessionInfoFieldsSchema,
  SessionInfoResponseSchema,
  SessionInfoSnapshotSchema,
} from './copilot.js';

export type {
  AssistantDeltaPayload,
  AssistantDeltaSessionEvent,
  AssistantDonePayload,
  AssistantDoneSessionEvent,
  AssistantErrorPayload,
  AssistantErrorSessionEvent,
  CommandAcknowledgementPayload,
  CommandName,
  CopilotV1EventName,
  EntityCreatedEventPayload,
  EntityCreatedSessionEvent,
  EntityMovedEventPayload,
  EntityMovedSessionEvent,
  EntityUpdatedEventPayload,
  EntityUpdatedSessionEvent,
  KnownCopilotV1SessionEvent,
  PromptCancelPayload,
  PromptCancelSessionEvent,
  PromptSendPayload,
  PromptSendSessionEvent,
  QuestionAnswerPayload,
  QuestionAnswerSessionEvent,
  QuestionAskPayload,
  SessionClosedEvent,
  SessionClosedEventPayload,
  SessionCommand,
  SessionEventEnvelope,
  SessionSnapshotEvent,
  SessionSnapshotPayload,
  SessionUpdatedEvent,
  SessionUpdatedPayload,
  SessionUpdatePayload,
  SessionUpdateSessionEvent,
} from './copilot-ws-events.js';

export {
  AssistantDeltaPayloadSchema,
  AssistantDonePayloadSchema,
  AssistantErrorPayloadSchema,
  AssistantTextDeltaPayloadSchema,
  CommandAcknowledgementPayloadSchema,
  CommandNameSchema,
  CopilotV1EventNameSchema,
  CopilotV1EventNames,
  createSessionEventEnvelopeSchema,
  EntityCreatedEventPayloadSchema,
  EntityEventMetadataCoreSchema,
  EntityMovedEventPayloadSchema,
  EntityUpdatedEventPayloadSchema,
  PromptCancelPayloadSchema,
  PromptSendPayloadSchema,
  QuestionAnswerPayloadSchema,
  QuestionAskPayloadSchema,
  SessionClosedEventPayloadSchema,
  SessionSnapshotPayloadSchema,
  SessionUpdatedPayloadSchema,
  SessionUpdatePayloadSchema,
} from './copilot-ws-events.js';

export type { QuestionOption, QuestionRequest } from './question.js';
export { QuestionOptionSchema, QuestionRequestSchema } from './question.js';
