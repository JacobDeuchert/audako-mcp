import { Type } from '@mariozechner/pi-ai';
export const TODO_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
export const TODO_PRIORITIES = ['high', 'medium', 'low'];
export const todoSchema = Type.Object({
    content: Type.String({
        description: 'Brief description of the task',
        minLength: 1,
    }),
    status: Type.Union(TODO_STATUSES.map(status => Type.Literal(status)), {
        description: 'Current status of the task: pending, in_progress, completed, cancelled',
    }),
    priority: Type.Union(TODO_PRIORITIES.map(priority => Type.Literal(priority)), {
        description: 'Priority level of the task: high, medium, low',
    }),
});
//# sourceMappingURL=todo.js.map