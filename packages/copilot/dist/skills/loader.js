import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseFrontmatter } from './utils.js';
/**
 * Loads and parses SKILL.md files from a directory.
 *
 * Scans the directory for subdirectories containing SKILL.md files,
 * parses their frontmatter, validates required fields, and returns
 * loaded skills along with any diagnostics.
 *
 * @param dir - The directory to scan for skills
 * @returns Object containing loaded skills and diagnostics
 */
export function loadSkillsFromDir(dir) {
    const skills = [];
    const diagnostics = [];
    // Return empty result if directory doesn't exist
    if (!existsSync(dir)) {
        return { skills, diagnostics };
    }
    try {
        // Read directory entries with file type info
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            // Skip non-directories and hidden entries
            if (!entry.isDirectory() || entry.name.startsWith('.')) {
                continue;
            }
            const skillDir = join(dir, entry.name);
            const skillFilePath = join(skillDir, 'SKILL.md');
            // Check if SKILL.md exists in this subdirectory
            if (!existsSync(skillFilePath)) {
                continue;
            }
            try {
                // Read and parse the SKILL.md file
                const content = readFileSync(skillFilePath, 'utf-8');
                const { frontmatter } = parseFrontmatter(content);
                const skillMeta = frontmatter;
                // Validate required fields
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
                // Create skill object
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
                // Handle errors gracefully - add to diagnostics instead of throwing
                diagnostics.push({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error loading skill',
                    path: skillFilePath,
                });
            }
        }
    }
    catch (error) {
        // Handle directory read errors gracefully
        diagnostics.push({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error reading directory',
            path: dir,
        });
    }
    return { skills, diagnostics };
}
//# sourceMappingURL=loader.js.map