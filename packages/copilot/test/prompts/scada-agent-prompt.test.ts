import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const prompt = readFileSync(resolve(import.meta.dirname, '../../prompts/scada-agent.md'), 'utf-8');

describe('scada-agent prompt', () => {
  it('mentions fast vs complex classification', () => {
    expect(prompt).toContain('`fast`');
    expect(prompt).toContain('`complex`');
  });

  it('requires todowrite for complex tasks', () => {
    expect(prompt).toContain('Use `todowrite` only for `complex` tasks');
    expect(prompt).toContain('write the initial todo list before mutations');
  });

  it('requires a final verification step for complex tasks', () => {
    expect(prompt).toContain('final verification todo item');
    expect(prompt).toContain('same-session verification phase');
    expect(prompt).toContain('Verified');
    expect(prompt).toContain('Unverified');
  });
});
