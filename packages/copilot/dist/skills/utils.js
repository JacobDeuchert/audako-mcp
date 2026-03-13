/**
 * Utility functions for the skill system.
 */
/**
 * Parses YAML frontmatter from markdown content.
 * Frontmatter is YAML content between `---` markers at the start of the file.
 * @param content - The file content to parse
 * @returns Object containing parsed frontmatter and remaining content
 */
export function parseFrontmatter(content) {
    const trimmed = content.trimStart();
    // Check if content starts with ---
    if (!trimmed.startsWith('---')) {
        return { frontmatter: {}, content: content };
    }
    // Find the closing ---
    const endMatch = trimmed.slice(3).search(/\n---/);
    if (endMatch === -1) {
        return { frontmatter: {}, content: content };
    }
    const frontmatterBlock = trimmed.slice(3, 3 + endMatch).trim();
    const remainingContent = trimmed.slice(3 + endMatch + 4).trimStart();
    // Parse simple YAML key-value pairs
    const frontmatter = {};
    const lines = frontmatterBlock.split('\n');
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#'))
            continue;
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex === -1)
            continue;
        const key = trimmedLine.slice(0, colonIndex).trim();
        let value = trimmedLine.slice(colonIndex + 1).trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        // Try to parse as number or boolean
        if (value === 'true') {
            frontmatter[key] = true;
        }
        else if (value === 'false') {
            frontmatter[key] = false;
        }
        else if (/^-?\d+$/.test(value)) {
            frontmatter[key] = parseInt(value, 10);
        }
        else if (/^-?\d+\.\d+$/.test(value)) {
            frontmatter[key] = parseFloat(value);
        }
        else {
            frontmatter[key] = value;
        }
    }
    return { frontmatter, content: remainingContent };
}
/**
 * Escapes XML special characters in a string.
 * @param str - The string to escape
 * @returns The escaped string safe for XML content
 */
export function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
/**
 * Validates a skill name according to naming conventions.
 * @param name - The skill name to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateSkillName(name) {
    const errors = [];
    // Check length (1-64 characters)
    if (name.length < 1) {
        errors.push('Skill name must be at least 1 character');
    }
    else if (name.length > 64) {
        errors.push('Skill name must be at most 64 characters');
    }
    // Check for valid characters (lowercase a-z, 0-9, hyphens only)
    if (!/^[a-z0-9-]+$/.test(name)) {
        errors.push('Skill name can only contain lowercase letters, numbers, and hyphens');
    }
    // Check no leading hyphen
    if (name.startsWith('-')) {
        errors.push('Skill name cannot start with a hyphen');
    }
    // Check no trailing hyphen
    if (name.endsWith('-')) {
        errors.push('Skill name cannot end with a hyphen');
    }
    // Check no consecutive hyphens
    if (name.includes('--')) {
        errors.push('Skill name cannot contain consecutive hyphens');
    }
    return errors;
}
//# sourceMappingURL=utils.js.map