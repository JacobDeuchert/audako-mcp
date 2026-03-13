import { describe, expect, it } from 'vitest';
import { formatSkillsForPrompt } from '../../src/skills/prompt.js';
import type { Skill } from '../../src/skills/types.js';

describe('formatSkillsForPrompt', () => {
  const createSkill = (overrides: Partial<Skill> = {}): Skill => ({
    name: 'test-skill',
    description: 'A test skill',
    filePath: '/path/to/skill/SKILL.md',
    baseDir: '/path/to/skill',
    source: 'project',
    disableModelInvocation: false,
    ...overrides,
  });

  it('should format multiple skills correctly', () => {
    const skills: Skill[] = [
      createSkill({ name: 'skill-one', description: 'First skill' }),
      createSkill({
        name: 'skill-two',
        description: 'Second skill',
        filePath: '/other/path/SKILL.md',
      }),
    ];

    const result = formatSkillsForPrompt(skills);

    expect(result).toContain('<available_skills>');
    expect(result).toContain('</available_skills>');
    expect(result).toContain('<name>skill-one</name>');
    expect(result).toContain('<name>skill-two</name>');
    expect(result).toContain('<description>First skill</description>');
    expect(result).toContain('<description>Second skill</description>');
    expect(result).toContain('<location>/path/to/skill/SKILL.md</location>');
    expect(result).toContain('<location>/other/path/SKILL.md</location>');
  });

  it('should return empty string for empty skills array', () => {
    const result = formatSkillsForPrompt([]);
    expect(result).toBe('');
  });

  it('should filter out skills with disableModelInvocation=true', () => {
    const skills: Skill[] = [
      createSkill({ name: 'visible-skill', description: 'You should see this' }),
      createSkill({
        name: 'hidden-skill',
        description: 'You should not see this',
        disableModelInvocation: true,
      }),
      createSkill({ name: 'another-visible', description: 'Also visible' }),
    ];

    const result = formatSkillsForPrompt(skills);

    expect(result).toContain('visible-skill');
    expect(result).toContain('another-visible');
    expect(result).not.toContain('hidden-skill');
    expect(result).not.toContain('You should not see this');
  });

  it('should return empty string when all skills have disableModelInvocation=true', () => {
    const skills: Skill[] = [
      createSkill({ name: 'hidden-1', description: 'Hidden', disableModelInvocation: true }),
      createSkill({ name: 'hidden-2', description: 'Also hidden', disableModelInvocation: true }),
    ];

    const result = formatSkillsForPrompt(skills);
    expect(result).toBe('');
  });

  it('should escape XML special characters in skill names', () => {
    const skills: Skill[] = [
      createSkill({ name: 'skill-with-&-and-<->', description: 'Test skill' }),
    ];

    const result = formatSkillsForPrompt(skills);

    expect(result).toContain('<name>skill-with-&amp;-and-&lt;-&gt;</name>');
    expect(result).not.toContain('<name>skill-with-&-and-<>-');
  });

  it('should escape XML special characters in descriptions', () => {
    const skills: Skill[] = [
      createSkill({ name: 'test-skill', description: 'Use <tag> & "quotes"' }),
    ];

    const result = formatSkillsForPrompt(skills);

    expect(result).toContain('<description>Use &lt;tag&gt; &amp; &quot;quotes&quot;</description>');
  });

  it('should escape XML special characters in file paths', () => {
    const skills: Skill[] = [
      createSkill({ name: 'test-skill', filePath: '/path/with<special>/SKILL.md' }),
    ];

    const result = formatSkillsForPrompt(skills);

    expect(result).toContain('<location>/path/with&lt;special&gt;/SKILL.md</location>');
  });

  it('should produce proper XML structure with correct indentation', () => {
    const skills: Skill[] = [createSkill({ name: 'my-skill', description: 'My description' })];

    const result = formatSkillsForPrompt(skills);
    const lines = result.split('\n');

    expect(lines).toContain('<available_skills>');
    expect(lines).toContain('  <skill>');
    expect(lines).toContain('    <name>my-skill</name>');
    expect(lines).toContain('    <description>My description</description>');
    expect(lines).toContain('    <location>/path/to/skill/SKILL.md</location>');
    expect(lines).toContain('  </skill>');
    expect(lines).toContain('</available_skills>');
  });

  it('should include intro text before XML block', () => {
    const skills: Skill[] = [createSkill()];

    const result = formatSkillsForPrompt(skills);

    expect(result).toContain('The following skills provide specialized instructions');
    expect(result).toContain("Use the read tool to load a skill's file");
  });

  it('should handle single skill correctly', () => {
    const skills: Skill[] = [createSkill({ name: 'solo-skill', description: 'Only skill' })];

    const result = formatSkillsForPrompt(skills);

    expect(result).toContain('<name>solo-skill</name>');
    expect(result).toContain('<description>Only skill</description>');
    expect(result).toContain('<available_skills>');
    expect(result).toContain('</available_skills>');
  });

  it('should escape single quotes in content', () => {
    const skills: Skill[] = [createSkill({ name: 'test-skill', description: "It's working" })];

    const result = formatSkillsForPrompt(skills);

    expect(result).toContain('<description>It&apos;s working</description>');
  });
});
