import { escapeXml } from './utils.js';
/**
 * Formats an array of skills as an XML block for injection into the system prompt.
 *
 * Filters out skills with disableModelInvocation=true and returns an empty string
 * if no visible skills remain. Uses progressive disclosure - only name and description
 * are included, not the full skill content.
 *
 * @param skills - Array of skills to format
 * @returns XML formatted string for system prompt injection, or empty string if no visible skills
 */
export function formatSkillsForPrompt(skills) {
    const visibleSkills = skills.filter(skill => !skill.disableModelInvocation);
    if (visibleSkills.length === 0) {
        return '';
    }
    const lines = [
        '',
        'The following skills provide specialized instructions for specific tasks.',
        "Use the read tool to load a skill's file when the task matches its description.",
        '<available_skills>',
    ];
    for (const skill of visibleSkills) {
        lines.push('  <skill>');
        lines.push(`    <name>${escapeXml(skill.name)}</name>`);
        lines.push(`    <description>${escapeXml(skill.description)}</description>`);
        lines.push('  </skill>');
    }
    lines.push('</available_skills>');
    return lines.join('\n');
}
//# sourceMappingURL=prompt.js.map