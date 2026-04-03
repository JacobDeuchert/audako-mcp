import { Type } from '@mariozechner/pi-ai';
import { getProfile, listCallableProfiles } from '../agent/profiles.js';
import { toTextResponse } from './helpers.js';
const taskToolSchema = Type.Object({
    description: Type.String({
        description: 'Short task summary for the delegated child agent.',
        minLength: 1,
    }),
    prompt: Type.String({
        description: 'Full prompt to execute in the child session.',
        minLength: 1,
    }),
    subagent_type: Type.String({
        description: 'Target callable profile name (for example: explore).',
        minLength: 1,
    }),
    tools: Type.Optional(Type.Array(Type.String({ minLength: 1 }), {
        description: 'Optional tool narrowing for the delegated child profile.',
        minItems: 1,
    })),
});
export function createTaskTool(sessionId, childSessionExecutor) {
    const callableProfiles = listCallableProfiles();
    const callableProfileSummary = callableProfiles
        .map(profile => `${profile.name} (${profile.description})`)
        .join(', ');
    return {
        name: 'task',
        label: 'Delegate Task',
        description: `Run a blocking child task with a callable subagent. Available subagents: ${callableProfileSummary}.`,
        parameters: taskToolSchema,
        execute: async (_toolCallId, params, signal) => {
            const profileName = params.subagent_type.trim();
            const description = params.description.trim();
            const prompt = params.prompt.trim();
            try {
                const profile = getProfile(profileName);
                if (!profile.callableAsSubagent) {
                    throw new Error(`Profile "${profileName}" is not callable as a subagent`);
                }
                const execution = await childSessionExecutor.execute({
                    parentSessionId: sessionId,
                    description,
                    prompt,
                    profile,
                    requestedTools: params.tools,
                    abortSignal: signal,
                });
                const resultBody = execution.status === 'completed'
                    ? `<task_result>${execution.resultText ?? ''}</task_result>`
                    : `<task_error>${execution.error ?? 'Unknown child task error'}</task_error>`;
                return toTextResponse([
                    `subagent: ${profile.name}`,
                    `child_session_id: ${execution.childSessionId}`,
                    `status: ${execution.status}`,
                    '',
                    resultBody,
                ].join('\n'));
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return toTextResponse([
                    `subagent: ${profileName}`,
                    'child_session_id: unavailable',
                    'status: failed',
                    '',
                    `<task_error>${errorMessage}</task_error>`,
                ].join('\n'));
            }
        },
    };
}
//# sourceMappingURL=task-tool.js.map