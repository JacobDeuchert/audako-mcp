/**
 * Skill command handler for parsing and processing /skill:name commands.
 *
 * Allows users to inject skill content into conversation context by using
 * commands like: /skill:mcp-debug check server health
 */
import { readFileSync } from 'fs';
/**
 * Parse a skill command from user input.
 * Expected format: /skill:name arguments...
 *
 * @param input - The user input string
 * @returns Parsed command or null if not a skill command
 */
export function parseSkillCommand(input) {
    const trimmed = input.trim();
    const prefix = '/skill:';
    // Check if input starts with the skill command prefix
    if (!trimmed.startsWith(prefix)) {
        return null;
    }
    // Remove the prefix and get everything after it
    const afterPrefix = trimmed.slice(prefix.length);
    // Find the first space to separate skill name from arguments
    const firstSpaceIndex = afterPrefix.indexOf(' ');
    let skillName;
    let args;
    if (firstSpaceIndex === -1) {
        // No space found - skill name is everything, args is empty
        skillName = afterPrefix;
        args = '';
    }
    else {
        // Space found - split into name and args
        skillName = afterPrefix.slice(0, firstSpaceIndex);
        args = afterPrefix.slice(firstSpaceIndex + 1).trimStart();
    }
    // Validate that we have a non-empty skill name
    if (!skillName) {
        return null;
    }
    return { skillName, args };
}
/**
 * Handle a skill command by looking up the skill and injecting its content.
 *
 * @param input - The user input string
 * @param skills - Array of available skills
 * @returns Handle result with modified input or error
 */
export function handleSkillCommand(input, skills) {
    const parsed = parseSkillCommand(input);
    // Not a skill command - pass through unchanged
    if (!parsed) {
        return { handled: false };
    }
    const { skillName, args } = parsed;
    // Find the skill by name
    const skill = skills.find(s => s.name === skillName);
    if (!skill) {
        // Build list of available skills for error message
        const availableSkills = skills.map(s => s.name).join(', ');
        const availableList = availableSkills || 'none';
        return {
            handled: true,
            error: `Skill '${skillName}' not found. Available: ${availableList}`,
        };
    }
    // Read the skill file content
    let skillContent;
    try {
        skillContent = readFileSync(skill.filePath, 'utf-8');
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return {
            handled: true,
            error: `Failed to read skill file '${skill.filePath}': ${errorMessage}`,
        };
    }
    // Build the modified input with skill content prepended
    const modifiedInput = `[Skill: ${skillName}]
${skillContent}

User request: ${args}`;
    return {
        handled: true,
        modifiedInput,
    };
}
//# sourceMappingURL=command-handler.js.map