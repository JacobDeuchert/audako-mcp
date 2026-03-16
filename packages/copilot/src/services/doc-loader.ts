import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

export function loadMarkdownFile(filePath: string): string {
  const fullPath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);

  try {
    return readFileSync(fullPath, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load markdown file at '${filePath}': ${errorMessage}`);
  }
}
