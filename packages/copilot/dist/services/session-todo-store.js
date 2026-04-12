export class SessionTodoStore {
    todosBySessionId = new Map();
    get(sessionId) {
        const todos = this.todosBySessionId.get(sessionId) ?? [];
        return structuredClone(todos);
    }
    set(sessionId, todos) {
        const clonedTodos = structuredClone(todos);
        this.todosBySessionId.set(sessionId, clonedTodos);
        return structuredClone(clonedTodos);
    }
    clear(sessionId) {
        this.todosBySessionId.delete(sessionId);
    }
}
//# sourceMappingURL=session-todo-store.js.map