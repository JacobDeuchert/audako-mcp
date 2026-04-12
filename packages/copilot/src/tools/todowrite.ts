import type { AgentTool } from '@mariozechner/pi-agent-core';
import { Type } from '@mariozechner/pi-ai';
import type { SessionTodoStore } from '../services/session-todo-store.js';
import { toTextResponse } from './helpers.js';

const TODO_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
const TODO_PRIORITIES = ['high', 'medium', 'low'] as const;

export type TodoStatus = (typeof TODO_STATUSES)[number];
export type TodoPriority = (typeof TODO_PRIORITIES)[number];

export interface Todo {
  content: string;
  status: TodoStatus;
  priority: TodoPriority;
}

const todoSchema = Type.Object({
  content: Type.String({
    description: 'Brief description of the task',
    minLength: 1,
  }),
  status: Type.Union(
    TODO_STATUSES.map(status => Type.Literal(status)),
    {
      description: 'Current status of the task: pending, in_progress, completed, cancelled',
    },
  ),
  priority: Type.Union(
    TODO_PRIORITIES.map(priority => Type.Literal(priority)),
    {
      description: 'Priority level of the task: high, medium, low',
    },
  ),
});

const todowriteSchema = Type.Object({
  todos: Type.Array(todoSchema, {
    description: 'Complete replacement todo list for the current session.',
  }),
});

interface TodowriteDetails {
  todos: Todo[];
}

export function createTodowriteTool(
  sessionId: string,
  sessionTodoStore: SessionTodoStore,
): AgentTool<typeof todowriteSchema> {
  return {
    name: 'todowrite',
    label: 'Write Todo List',
    description:
      'Replace the current session todo list with a concise structured task list for complex work.',
    parameters: todowriteSchema,
    execute: async (_toolCallId, params) => {
      const todos = sessionTodoStore.set(sessionId, params.todos);
      const summary =
        todos.length === 0
          ? 'Cleared session todo list.'
          : `Stored ${todos.length} todo item${todos.length === 1 ? '' : 's'} for this session.`;

      return toTextResponse<TodowriteDetails>(summary, { todos });
    },
  };
}
