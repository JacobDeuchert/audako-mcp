import { describe, expect, it } from 'vitest';
import { escapeXml, parseFrontmatter, validateSkillName } from '../../src/skills/utils.js';

describe('parseFrontmatter', () => {
  it('should parse valid frontmatter with content', () => {
    const content = `---
name: test-skill
description: A test skill
---

# Content
Some markdown here.`;
    const result = parseFrontmatter(content);
    expect(result.frontmatter).toEqual({
      name: 'test-skill',
      description: 'A test skill',
    });
    expect(result.content).toBe('# Content\nSome markdown here.');
  });

  it('should handle file without frontmatter', () => {
    const content = '# Just Content\nNo frontmatter here.';
    const result = parseFrontmatter(content);
    expect(result.frontmatter).toEqual({});
    expect(result.content).toBe('# Just Content\nNo frontmatter here.');
  });

  it('should handle empty frontmatter', () => {
    const content = `---
---

Content here.`;
    const result = parseFrontmatter(content);
    expect(result.frontmatter).toEqual({});
    expect(result.content).toBe('Content here.');
  });

  it('should parse string values', () => {
    const content = `---
name: my-skill
description: This is a string value
---

Content`;
    const result = parseFrontmatter(content);
    expect(result.frontmatter.name).toBe('my-skill');
    expect(result.frontmatter.description).toBe('This is a string value');
  });

  it('should parse numeric values (integers)', () => {
    const content = `---
count: 42
negative: -10
---

Content`;
    const result = parseFrontmatter(content);
    expect(result.frontmatter.count).toBe(42);
    expect(result.frontmatter.negative).toBe(-10);
  });

  it('should parse numeric values (floats)', () => {
    const content = `---
pi: 3.14159
negative: -0.5
---

Content`;
    const result = parseFrontmatter(content);
    expect(result.frontmatter.pi).toBe(3.14159);
    expect(result.frontmatter.negative).toBe(-0.5);
  });

  it('should parse boolean values', () => {
    const content = `---
enabled: true
disabled: false
---

Content`;
    const result = parseFrontmatter(content);
    expect(result.frontmatter.enabled).toBe(true);
    expect(result.frontmatter.disabled).toBe(false);
  });

  it('should handle quoted values', () => {
    const content = `---
name: "quoted-name"
description: 'single-quoted'
---

Content`;
    const result = parseFrontmatter(content);
    expect(result.frontmatter.name).toBe('quoted-name');
    expect(result.frontmatter.description).toBe('single-quoted');
  });

  it('should ignore comment lines', () => {
    const content = `---
# This is a comment
name: test-skill
# Another comment
description: A skill
---

Content`;
    const result = parseFrontmatter(content);
    expect(result.frontmatter.name).toBe('test-skill');
    expect(result.frontmatter.description).toBe('A skill');
  });

  it('should handle frontmatter with leading whitespace', () => {
    const content = `
   
---
name: test-skill
---

Content`;
    const result = parseFrontmatter(content);
    expect(result.frontmatter.name).toBe('test-skill');
    expect(result.content).toBe('Content');
  });

  it('should return original content when closing --- not found', () => {
    const content = `---
name: test-skill
no closing marker

Content`;
    const result = parseFrontmatter(content);
    expect(result.frontmatter).toEqual({});
    expect(result.content).toBe(content);
  });
});

describe('escapeXml', () => {
  it('should escape ampersand', () => {
    expect(escapeXml('A & B')).toBe('A &amp; B');
  });

  it('should escape less than', () => {
    expect(escapeXml('A < B')).toBe('A &lt; B');
  });

  it('should escape greater than', () => {
    expect(escapeXml('A > B')).toBe('A &gt; B');
  });

  it('should escape double quote', () => {
    expect(escapeXml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('should escape single quote', () => {
    expect(escapeXml("it's working")).toBe('it&apos;s working');
  });

  it('should escape all special characters', () => {
    const input = `<tag attr="value">Test & 'more'</tag>`;
    const expected = `&lt;tag attr=&quot;value&quot;&gt;Test &amp; &apos;more&apos;&lt;/tag&gt;`;
    expect(escapeXml(input)).toBe(expected);
  });

  it('should not change normal string', () => {
    expect(escapeXml('Normal text without special chars')).toBe(
      'Normal text without special chars',
    );
  });

  it('should handle empty string', () => {
    expect(escapeXml('')).toBe('');
  });

  it('should handle string with only special chars', () => {
    expect(escapeXml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&apos;');
  });
});

describe('validateSkillName', () => {
  it('should accept valid names', () => {
    expect(validateSkillName('valid-name')).toEqual([]);
    expect(validateSkillName('my-skill')).toEqual([]);
    expect(validateSkillName('skill123')).toEqual([]);
    expect(validateSkillName('test-skill-2')).toEqual([]);
    expect(validateSkillName('a')).toEqual([]); // minimum 1 char
  });

  it('should reject invalid characters', () => {
    expect(validateSkillName('Invalid_Name')).toContain(
      'Skill name can only contain lowercase letters, numbers, and hyphens',
    );
    expect(validateSkillName('Invalid Name')).toContain(
      'Skill name can only contain lowercase letters, numbers, and hyphens',
    );
    expect(validateSkillName('invalid.name')).toContain(
      'Skill name can only contain lowercase letters, numbers, and hyphens',
    );
    expect(validateSkillName('INVALID')).toContain(
      'Skill name can only contain lowercase letters, numbers, and hyphens',
    );
    expect(validateSkillName('test@skill')).toContain(
      'Skill name can only contain lowercase letters, numbers, and hyphens',
    );
  });

  it('should reject leading hyphens', () => {
    expect(validateSkillName('-leading')).toContain('Skill name cannot start with a hyphen');
  });

  it('should reject trailing hyphens', () => {
    expect(validateSkillName('trailing-')).toContain('Skill name cannot end with a hyphen');
  });

  it('should reject consecutive hyphens', () => {
    expect(validateSkillName('double--hyphen')).toContain(
      'Skill name cannot contain consecutive hyphens',
    );
    expect(validateSkillName('triple---hyphen')).toContain(
      'Skill name cannot contain consecutive hyphens',
    );
  });

  it('should reject empty string', () => {
    expect(validateSkillName('')).toContain('Skill name must be at least 1 character');
  });

  it('should reject names over 64 characters', () => {
    const longName = 'a'.repeat(65);
    expect(validateSkillName(longName)).toContain('Skill name must be at most 64 characters');
  });

  it('should accept name at exactly 64 characters', () => {
    const validLengthName = 'a'.repeat(64);
    expect(validateSkillName(validLengthName)).toEqual([]);
  });

  it('should return multiple errors for multiple violations', () => {
    const result = validateSkillName('-invalid--name-');
    expect(result.length).toBeGreaterThan(1);
    expect(result).toContain('Skill name cannot start with a hyphen');
    expect(result).toContain('Skill name cannot end with a hyphen');
    expect(result).toContain('Skill name cannot contain consecutive hyphens');
  });
});
