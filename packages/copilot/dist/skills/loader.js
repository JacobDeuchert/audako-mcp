import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseFrontmatter } from './utils.js';
export function loadSkillsFromDir(dir) {
    const skills = [];
    const diagnostics = [];
    if (!existsSync(dir)) {
        return { skills, diagnostics };
    }
    try {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory() || entry.name.startsWith('.')) {
                continue;
            }
            const skillDir = join(dir, entry.name);
            const skillFilePath = join(skillDir, 'SKILL.md');
            if (!existsSync(skillFilePath)) {
                continue;
            }
            try {
                const content = readFileSync(skillFilePath, 'utf-8');
                const { frontmatter } = parseFrontmatter(content);
                const skillMeta = frontmatter;
                if (!skillMeta.name) {
                    diagnostics.push({
                        type: 'warning',
                        message: `Skill in "${entry.name}" is missing required field: name`,
                        path: skillFilePath,
                    });
                    continue;
                }
                if (!skillMeta.description) {
                    diagnostics.push({
                        type: 'warning',
                        message: `Skill "${skillMeta.name}" is missing required field: description`,
                        path: skillFilePath,
                    });
                    continue;
                }
                const skill = {
                    name: skillMeta.name,
                    description: skillMeta.description,
                    filePath: skillFilePath,
                    baseDir: skillDir,
                    source: 'project',
                    disableModelInvocation: skillMeta['disable-model-invocation'] ?? false,
                };
                skills.push(skill);
            }
            catch (error) {
                diagnostics.push({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error loading skill',
                    path: skillFilePath,
                });
            }
        }
    }
    catch (error) {
        diagnostics.push({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error reading directory',
            path: dir,
        });
    }
    return { skills, diagnostics };
}
//# sourceMappingURL=loader.js.map