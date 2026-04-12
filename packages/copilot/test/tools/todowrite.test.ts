import { describe, expect, it } from 'vitest';
import { SessionTodoStore } from '../../src/services/session-todo-store.js';
import { createTodowriteTool } from '../../src/tools/todowrite.js';

function getTextContent(result: { content: Array<{ type: string; text?: string }> }): string {
  const first = result.content[0];
  if (!first || first.type !== 'text') {
    throw new Error('Expected text content response');
  }

  return first.text ?? '';
}

describe('createTodowriteTool', () => {
  it('stores the latest todo list and returns summary metadata', async () => {
    const store = new SessionTodoStore();
    const tool = createTodowriteTool('session-1', store);

    const todos = [
      { content: 'Create area tree', status: 'in_progress' as const, priority: 'high' as const },
      {
        content: 'Verify created entities',
        status: 'pending' as const,
        priority: 'medium' as const,
      },
    ];

    const result = await tool.execute('tool-call-1', { todos });

    expect(getTextContent(result as never)).toBe('Stored 2 todo items for this session.');
    expect(result.details).toEqual({ todos });
    expect(store.get('session-1')).toEqual(todos);
  });

  it('supports clearing the todo list with an empty replacement', async () => {
    const store = new SessionTodoStore();
    store.set('session-1', [{ content: 'Old task', status: 'pending', priority: 'high' }]);
    const tool = createTodowriteTool('session-1', store);

    const result = await tool.execute('tool-call-1', { todos: [] });

    expect(getTextContent(result as never)).toBe('Cleared session todo list.');
    expect(result.details).toEqual({ todos: [] });
    expect(store.get('session-1')).toEqual([]);
  });
});
