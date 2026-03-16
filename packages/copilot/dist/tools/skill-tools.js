import { Type } from '@mariozechner/pi-ai';
import { readFileSync } from 'fs';
export function createReadSkillTool(skills) {
    return {
        name: 'read_skill',
        label: 'Read Skill',
        description: 'Read a skill file to get detailed instructions. Use when the task matches a skill description.',
        parameters: Type.Object({
            skillName: Type.String({ description: 'Name of the skill to read' }),
        }),
        execute: async (_toolCallId, params) => {
            const { skillName } = params;
            const skill = skills.find(s => s.name === skillName);
            if (!skill) {
                throw new Error(`Skill '${skillName}' not found`);
            }
            const fileContent = readFileSync(skill.filePath, 'utf-8');
            return {
                content: [{ type: 'text', text: fileContent }],
                details: { skillName },
            };
        },
    };
}
//# sourceMappingURL=skill-tools.js.map