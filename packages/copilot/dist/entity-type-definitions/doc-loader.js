import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function resolveDocsPath(relativePath) {
    const distPath = join(__dirname, relativePath);
    if (existsSync(distPath)) {
        return distPath;
    }
    const srcPath = join(__dirname, '..', '..', 'src', 'entity-type-definitions', relativePath);
    if (existsSync(srcPath)) {
        return srcPath;
    }
    return distPath;
}
export function loadMarkdownContent(relativePath) {
    const fullPath = resolveDocsPath(relativePath);
    try {
        return readFileSync(fullPath, 'utf-8');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to load markdown file at '${relativePath}': ${errorMessage}`);
    }
}
export function resolveExtendedInfo(extendedInfo) {
    if (extendedInfo.type === 'string') {
        return extendedInfo.content;
    }
    if (extendedInfo.type === 'markdownFile') {
        return loadMarkdownContent(extendedInfo.path);
    }
    throw new Error(`Unknown extended info type: ${extendedInfo.type}`);
}
//# sourceMappingURL=doc-loader.js.map