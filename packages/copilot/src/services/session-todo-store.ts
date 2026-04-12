import type { Todo } from '../tools/todowrite.js';

export class SessionTodoStore {
  private readonly todosBySessionId = new Map<string, Todo[]>();

  get(sessionId: string): Todo[] {
    const todos = this.todosBySessionId.get(sessionId) ?? [];
    return structuredClone(todos);
  }

  set(sessionId: string, todos: Todo[]): Todo[] {
    const clonedTodos = structuredClone(todos);
    this.todosBySessionId.set(sessionId, clonedTodos);
    return structuredClone(clonedTodos);
  }

  clear(sessionId: string): void {
    this.todosBySessionId.delete(sessionId);
  }
}
