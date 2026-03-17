import { Type } from '@mariozechner/pi-ai';
import { readFileSync } from 'fs';
function fmtSkills(skills, opts) {
    if (skills.length === 0) {
        return 'No skills are currently available.';
    }
    if (opts.verbose) {
        return [
            '<available_skills>',
            ...skills.flatMap(skill => [
                '  <skill>',
                `    <name>${skill.name}</name>`,
                `    <description>${skill.description}</description>`,
                '  </skill>',
            ]),
            '</available_skills>',
        ].join('\n');
    }
    return [
        '## Available Skills',
        ...skills.flatMap(skill => `- **${skill.name}**: ${skill.description}`),
    ].join('\n');
}
function createSkillToolDescription(skills) {
    if (skills.length === 0) {
        return 'Load a specialized skill that provides domain-specific instructions and workflows. No skills are currently available.';
    }
    return [
        'Load a specialized skill that provides domain-specific instructions and workflows.',
        '',
        'When you recognize that a task matches one of the available skills listed below, use this tool to load the full skill instructions.',
        '',
        'The skill will inject detailed instructions, workflows, and access to bundled resources (scripts, references, templates) into the conversation context.',
        '',
        'Tool output includes a `<skill_content name="...">` block with the loaded content.',
        '',
        'The following skills provide specialized sets of instructions for particular tasks',
        'Invoke this tool to load a skill when a task matches one of the available skills listed below:',
        '',
        fmtSkills(skills, { verbose: false }),
    ].join('\n');
}
const skillSchema = Type.Object({
    name: Type.String({ description: 'Name of the skill to load' }),
});
export function createReadSkillTool(skills) {
    return {
        name: 'skill',
        label: 'Skill',
        description: createSkillToolDescription(skills),
        parameters: skillSchema,
        execute: async (_toolCallId, params) => {
            const { name: skillName } = params;
            const skill = skills.find(s => s.name === skillName);
            if (!skill) {
                throw new Error(`Skill '${skillName}' not found`);
            }
            const fileContent = readFileSync(skill.filePath, 'utf-8');
            const wrappedContent = `<skill_content name="${skill.name}">\n${fileContent}\n</skill_content>`;
            return {
                content: [{ type: 'text', text: wrappedContent }],
                details: { skillName },
            };
        },
    };
}
//# sourceMappingURL=skill-tools.js.map