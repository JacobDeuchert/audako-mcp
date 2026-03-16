export function parseFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  content: string;
} {
  const trimmed = content.trimStart();

  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, content: content };
  }

  const endMatch = trimmed.slice(3).search(/\n---/);
  if (endMatch === -1) {
    return { frontmatter: {}, content: content };
  }

  const frontmatterBlock = trimmed.slice(3, 3 + endMatch).trim();
  const remainingContent = trimmed.slice(3 + endMatch + 4).trimStart();

  const frontmatter: Record<string, any> = {};
  const lines = frontmatterBlock.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmedLine.slice(0, colonIndex).trim();
    let value = trimmedLine.slice(colonIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value === 'true') {
      frontmatter[key] = true;
    } else if (value === 'false') {
      frontmatter[key] = false;
    } else if (/^-?\d+$/.test(value)) {
      frontmatter[key] = parseInt(value, 10);
    } else if (/^-?\d+\.\d+$/.test(value)) {
      frontmatter[key] = parseFloat(value);
    } else {
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: remainingContent };
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function validateSkillName(name: string): string[] {
  const errors: string[] = [];

  if (name.length < 1) {
    errors.push('Skill name must be at least 1 character');
  } else if (name.length > 64) {
    errors.push('Skill name must be at most 64 characters');
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push('Skill name can only contain lowercase letters, numbers, and hyphens');
  }

  if (name.startsWith('-')) {
    errors.push('Skill name cannot start with a hyphen');
  }

  if (name.endsWith('-')) {
    errors.push('Skill name cannot end with a hyphen');
  }

  if (name.includes('--')) {
    errors.push('Skill name cannot contain consecutive hyphens');
  }

  return errors;
}
