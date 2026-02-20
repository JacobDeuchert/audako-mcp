import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { logger } from '../services/logger.js';

const docsDir = join(import.meta.dirname, '..', 'docs');

export function registerDocsResources(server: McpServer): void {
  server.registerResource(
    'docs-index',
    'docs://index',
    { description: 'List of all available documentation files' },
    async () => {
      await logger.trace('docs-index', 'listing documentation files');
      const files = await readdir(docsDir);
      const mdFiles = files.filter(fileName => fileName.endsWith('.md'));

      await logger.debug('docs-index: found documentation files', {
        count: mdFiles.length,
        files: mdFiles,
      });

      return {
        contents: [
          {
            uri: 'docs://index',
            mimeType: 'text/plain',
            text: mdFiles.join('\n'),
          },
        ],
      };
    },
  );

  server.registerResource(
    'doc',
    new ResourceTemplate('docs://files/{filename}', { list: undefined }),
    { description: 'Read a specific documentation file by name' },
    async (uri, { filename }) => {
      await logger.trace('doc', 'reading documentation file', { filename });

      try {
        const content = await readFile(join(docsDir, filename as string), 'utf-8');

        await logger.debug('doc: file read successfully', {
          filename,
          size: content.length,
        });

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'text/markdown',
              text: content,
            },
          ],
        };
      } catch (error) {
        await logger.error('doc: failed to read file', {
          filename,
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    },
  );
}
