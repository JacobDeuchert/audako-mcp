import { mkdirSync, rmdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadSkillsFromDir } from '../../src/skills/loader.js';

describe('loadSkillsFromDir', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `skill-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should load valid skills from directory', () => {
    const skillDir = join(tempDir, 'test-skill');
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      `---
name: test-skill
description: A test skill
---

# Test Skill Content`,
    );

    const result = loadSkillsFromDir(tempDir);

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('test-skill');
    expect(result.skills[0].description).toBe('A test skill');
    expect(result.skills[0].source).toBe('project');
    expect(result.skills[0].disableModelInvocation).toBe(false);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should return empty array for missing directory', () => {
    const nonExistentDir = join(tempDir, 'non-existent');

    const result = loadSkillsFromDir(nonExistentDir);

    expect(result.skills).toHaveLength(0);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should skip skills without description and add warning', () => {
    const skillDir = join(tempDir, 'no-desc-skill');
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      `---
name: no-desc-skill
---

# No Description`,
    );

    const result = loadSkillsFromDir(tempDir);

    expect(result.skills).toHaveLength(0);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].type).toBe('warning');
    expect(result.diagnostics[0].message).toContain('missing required field: description');
    expect(result.diagnostics[0].path).toBe(join(skillDir, 'SKILL.md'));
  });

  it('should skip skills without name and add warning', () => {
    const skillDir = join(tempDir, 'no-name-skill');
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      `---
description: A skill without a name
---

# No Name`,
    );

    const result = loadSkillsFromDir(tempDir);

    expect(result.skills).toHaveLength(0);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].type).toBe('warning');
    expect(result.diagnostics[0].message).toContain('missing required field: name');
  });

  it('should load multiple skills', () => {
    const skill1Dir = join(tempDir, 'skill-one');
    const skill2Dir = join(tempDir, 'skill-two');
    mkdirSync(skill1Dir);
    mkdirSync(skill2Dir);

    writeFileSync(
      join(skill1Dir, 'SKILL.md'),
      `---
name: skill-one
description: First skill
---

# Skill One`,
    );

    writeFileSync(
      join(skill2Dir, 'SKILL.md'),
      `---
name: skill-two
description: Second skill
---

# Skill Two`,
    );

    const result = loadSkillsFromDir(tempDir);

    expect(result.skills).toHaveLength(2);
    const names = result.skills.map(s => s.name).sort();
    expect(names).toEqual(['skill-one', 'skill-two']);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should handle disable-model-invocation flag', () => {
    const skillDir = join(tempDir, 'hidden-skill');
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      `---
name: hidden-skill
description: Hidden from model
disable-model-invocation: true
---

# Hidden`,
    );

    const result = loadSkillsFromDir(tempDir);

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].disableModelInvocation).toBe(true);
  });

  it('should skip directories without SKILL.md', () => {
    const skillDir = join(tempDir, 'has-skill');
    const emptyDir = join(tempDir, 'empty-dir');
    mkdirSync(skillDir);
    mkdirSync(emptyDir);

    writeFileSync(
      join(skillDir, 'SKILL.md'),
      `---
name: has-skill
description: Has skill file
---

# Content`,
    );

    const result = loadSkillsFromDir(tempDir);

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('has-skill');
  });

  it('should skip hidden directories', () => {
    const skillDir = join(tempDir, '.hidden-skill');
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      `---
name: hidden-skill
description: Should be skipped
---

# Content`,
    );

    const result = loadSkillsFromDir(tempDir);

    expect(result.skills).toHaveLength(0);
  });

  it('should handle files in root directory (not subdirectories)', () => {
    writeFileSync(
      join(tempDir, 'SKILL.md'),
      `---
name: root-skill
description: In root
---

# Root`,
    );

    const result = loadSkillsFromDir(tempDir);

    expect(result.skills).toHaveLength(0);
  });

  it('should set correct filePath and baseDir', () => {
    const skillDir = join(tempDir, 'my-skill');
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      `---
name: my-skill
description: My skill
---

# Content`,
    );

    const result = loadSkillsFromDir(tempDir);

    expect(result.skills[0].filePath).toBe(join(skillDir, 'SKILL.md'));
    expect(result.skills[0].baseDir).toBe(skillDir);
  });

  it('should handle skills with various value types in frontmatter', () => {
    const skillDir = join(tempDir, 'typed-skill');
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      `---
name: typed-skill
description: Skill with types
count: 42
enabled: true
ratio: 3.14
---

# Content`,
    );

    const result = loadSkillsFromDir(tempDir);

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('typed-skill');
  });

  it('should handle parse errors gracefully', () => {
    const skillDir = join(tempDir, 'invalid-skill');
    mkdirSync(skillDir);
    writeFileSync(join(skillDir, 'SKILL.md'), 'not valid frontmatter structure');

    const result = loadSkillsFromDir(tempDir);

    expect(result.skills).toHaveLength(0);
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle quoted strings in frontmatter', () => {
    const skillDir = join(tempDir, 'quoted-skill');
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      `---
name: "quoted-name"
description: 'quoted description'
---

# Content`,
    );

    const result = loadSkillsFromDir(tempDir);

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('quoted-name');
    expect(result.skills[0].description).toBe('quoted description');
  });
});
