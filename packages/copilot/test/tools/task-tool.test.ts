import { describe, expect, it, vi } from 'vitest';
import type { ChildSessionExecutor } from '../../src/services/child-session-executor.js';
import { createTaskTool } from '../../src/tools/task-tool.js';

function asExecutor(execute: ReturnType<typeof vi.fn>): ChildSessionExecutor {
  return { execute } as Pick<ChildSessionExecutor, 'execute'> as ChildSessionExecutor;
}

function getTextContent(result: { content: Array<{ type: string; text?: string }> }): string {
  const first = result.content[0];
  if (!first || first.type !== 'text') {
    throw new Error('Expected text content response');
  }

  return first.text ?? '';
}

describe('createTaskTool', () => {
  it('lists callable subagents in the description', () => {
    const execute = vi.fn();
    const executor = asExecutor(execute);

    const tool = createTaskTool('parent-session-1', executor);

    expect(tool.name).toBe('task');
    expect(tool.description).toContain('explore');
  });

  it('runs explore child task synchronously and returns deterministic success envelope', async () => {
    const execute = vi.fn(async () => ({
      childSessionId: 'child-session-1',
      status: 'completed' as const,
      resultText: 'Child agent response here',
    }));
    const executor = asExecutor(execute);

    const tool = createTaskTool('parent-session-1', executor);
    const result = await tool.execute('tool-call-1', {
      description: 'Find matching entities',
      prompt: 'Search all entities in tenant and summarize',
      subagent_type: 'explore',
      tools: ['get_session_info'],
    });

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        parentSessionId: 'parent-session-1',
        description: 'Find matching entities',
        prompt: 'Search all entities in tenant and summarize',
        profile: expect.objectContaining({ name: 'explore' }),
        requestedTools: ['get_session_info'],
      }),
    );

    expect(getTextContent(result as never)).toBe(
      [
        'subagent: explore',
        'child_session_id: child-session-1',
        'status: completed',
        '',
        '<task_result>Child agent response here</task_result>',
      ].join('\n'),
    );
  });

  it('returns explicit error envelope for unknown profile', async () => {
    const execute = vi.fn();
    const executor = asExecutor(execute);

    const tool = createTaskTool('parent-session-1', executor);
    const result = await tool.execute('tool-call-1', {
      description: 'unknown profile run',
      prompt: 'run',
      subagent_type: 'missing-profile',
    });

    expect(execute).not.toHaveBeenCalled();
    const text = getTextContent(result as never);
    expect(text).toContain('subagent: missing-profile');
    expect(text).toContain('status: failed');
    expect(text).toContain('<task_error>Unknown agent profile: "missing-profile"</task_error>');
  });

  it('returns explicit error envelope for non-callable profile', async () => {
    const execute = vi.fn();
    const executor = asExecutor(execute);

    const tool = createTaskTool('parent-session-1', executor);
    const result = await tool.execute('tool-call-1', {
      description: 'reject primary',
      prompt: 'run',
      subagent_type: 'primary',
    });

    expect(execute).not.toHaveBeenCalled();
    const text = getTextContent(result as never);
    expect(text).toContain('subagent: primary');
    expect(text).toContain('status: failed');
    expect(text).toContain(
      '<task_error>Profile "primary" is not callable as a subagent</task_error>',
    );
  });
});
