import { describe, expect, it } from 'vitest';
import { SessionTodoStore } from '../../src/services/session-todo-store.js';
import type { Todo } from '../../src/tools/todowrite.js';

const sampleTodo = (overrides: Partial<Todo> = {}): Todo => ({
  content: 'Create devices',
  status: 'pending',
  priority: 'high',
  ...overrides,
});

describe('SessionTodoStore', () => {
  it('stores and returns todos for a session', () => {
    const store = new SessionTodoStore();
    const todos = [sampleTodo()];

    const stored = store.set('session-1', todos);

    expect(stored).toEqual(todos);
    expect(store.get('session-1')).toEqual(todos);
  });

  it('isolates todos by session', () => {
    const store = new SessionTodoStore();

    store.set('session-1', [sampleTodo({ content: 'Session 1 task' })]);
    store.set('session-2', [sampleTodo({ content: 'Session 2 task', priority: 'low' })]);

    expect(store.get('session-1')).toEqual([sampleTodo({ content: 'Session 1 task' })]);
    expect(store.get('session-2')).toEqual([
      sampleTodo({ content: 'Session 2 task', priority: 'low' }),
    ]);
  });

  it('returns cloned data instead of raw references', () => {
    const store = new SessionTodoStore();
    const input = [sampleTodo()];

    const stored = store.set('session-1', input);
    input[0].content = 'Mutated input';
    stored[0].content = 'Mutated result';

    const read = store.get('session-1');
    read[0].content = 'Mutated read';

    expect(store.get('session-1')).toEqual([sampleTodo()]);
  });

  it('clears a session todo list', () => {
    const store = new SessionTodoStore();
    store.set('session-1', [sampleTodo()]);

    store.clear('session-1');

    expect(store.get('session-1')).toEqual([]);
  });
});
