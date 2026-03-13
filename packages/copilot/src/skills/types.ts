/**
 * Skill system type definitions for the copilot package.
 *
 * Based on the Agent Skills specification (agentskills.io).
 * Skills are file-based and use YAML frontmatter in SKILL.md files.
 */

/**
 * Frontmatter metadata parsed from SKILL.md files.
 * All fields are optional in the frontmatter itself.
 */
export interface SkillFrontmatter {
  /** Skill name. If not provided, derived from file path. */
  name?: string;

  /** Human-readable description of what the skill does. */
  description?: string;

  /** When true, disables automatic model invocation for this skill. */
  'disable-model-invocation'?: boolean;
}

/**
 * A loaded skill with all metadata resolved.
 */
export interface Skill {
  /** Unique skill name (from frontmatter or derived). */
  name: string;

  /** Human-readable description of what the skill does. */
  description: string;

  /** Absolute path to the skill file. */
  filePath: string;

  /** Base directory containing the skill. */
  baseDir: string;

  /** Source identifier for the skill (e.g., 'builtin', 'user', 'project'). */
  source: string;

  /** Whether model invocation is disabled for this skill. */
  disableModelInvocation: boolean;
}

/**
 * Diagnostic information about a resource loading issue.
 */
export interface ResourceDiagnostic {
  /** Severity level of the diagnostic. */
  type: 'warning' | 'error';

  /** Human-readable message describing the issue. */
  message: string;

  /** Optional path to the resource with the issue. */
  path?: string;
}

/**
 * Result of loading skills from the file system.
 */
export interface LoadSkillsResult {
  /** Successfully loaded skills. */
  skills: Skill[];

  /** Diagnostics for any issues encountered during loading. */
  diagnostics: ResourceDiagnostic[];
}
