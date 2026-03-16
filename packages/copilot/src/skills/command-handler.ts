import { readFileSync } from 'fs';
import type { Skill } from './types.js';

interface ParsedCommand {
  skillName: string;
  args: string;
}

interface HandleResult {
  handled: boolean;
  modifiedInput?: string;
  error?: string;
}

export function parseSkillCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  const prefix = '/skill:';

  if (!trimmed.startsWith(prefix)) {
    return null;
  }

  const afterPrefix = trimmed.slice(prefix.length);
  const firstSpaceIndex = afterPrefix.indexOf(' ');

  let skillName: string;
  let args: string;

  if (firstSpaceIndex === -1) {
    skillName = afterPrefix;
    args = '';
  } else {
    skillName = afterPrefix.slice(0, firstSpaceIndex);
    args = afterPrefix.slice(firstSpaceIndex + 1).trimStart();
  }

  if (!skillName) {
    return null;
  }

  return { skillName, args };
}

export function handleSkillCommand(input: string, skills: Skill[]): HandleResult {
  const parsed = parseSkillCommand(input);

  if (!parsed) {
    return { handled: false };
  }

  const { skillName, args } = parsed;
  const skill = skills.find(s => s.name === skillName);

  if (!skill) {
    const availableSkills = skills.map(s => s.name).join(', ');
    const availableList = availableSkills || 'none';

    return {
      handled: true,
      error: `Skill '${skillName}' not found. Available: ${availableList}`,
    };
  }

  let skillContent: string;
  try {
    skillContent = readFileSync(skill.filePath, 'utf-8');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return {
      handled: true,
      error: `Failed to read skill file '${skill.filePath}': ${errorMessage}`,
    };
  }

  const modifiedInput = `[Skill: ${skillName}]\n${skillContent}\n\nUser request: ${args}`;

  return {
    handled: true,
    modifiedInput,
  };
}
