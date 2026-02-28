import { describe, expect, it } from 'vitest';
import { loadSystemPrompt } from '../index.js';
describe('appConfig defaults and structure', () => {
    it('should have all required config keys', async () => {
        const { appConfig } = await import('../index.js');
        // Check that appConfig exists and has all required keys
        expect(appConfig).toHaveProperty('port');
        expect(appConfig).toHaveProperty('host');
        expect(appConfig).toHaveProperty('cors');
        expect(appConfig).toHaveProperty('session');
        expect(appConfig).toHaveProperty('llm');
        expect(appConfig).toHaveProperty('mutation');
        expect(appConfig).toHaveProperty('request');
        expect(appConfig).toHaveProperty('logLevel');
    });
    it('should have correct structure for cors config', async () => {
        const { appConfig } = await import('../index.js');
        expect(appConfig.cors).toHaveProperty('origins');
        expect(Array.isArray(appConfig.cors.origins)).toBe(true);
    });
    it('should have correct structure for session config', async () => {
        const { appConfig } = await import('../index.js');
        expect(appConfig.session).toHaveProperty('idleTimeout');
        expect(typeof appConfig.session.idleTimeout).toBe('number');
    });
    it('should have correct structure for llm config', async () => {
        const { appConfig } = await import('../index.js');
        expect(appConfig.llm).toHaveProperty('provider');
        expect(appConfig.llm).toHaveProperty('modelName');
        expect(typeof appConfig.llm.provider).toBe('string');
        expect(typeof appConfig.llm.modelName).toBe('string');
    });
    it('should have correct structure for mutation config', async () => {
        const { appConfig } = await import('../index.js');
        expect(appConfig.mutation).toHaveProperty('delayMs');
        expect(typeof appConfig.mutation.delayMs).toBe('number');
    });
    it('should have correct structure for request config', async () => {
        const { appConfig } = await import('../index.js');
        expect(appConfig.request).toHaveProperty('timeoutMs');
        expect(typeof appConfig.request.timeoutMs).toBe('number');
    });
    it('should have sensible default values', async () => {
        const { appConfig } = await import('../index.js');
        // Port should be 3001 for copilot
        expect(appConfig.port).toBe(3001);
        // Host defaults to all interfaces
        expect(appConfig.host).toBe('0.0.0.0');
        // Session idle timeout defaults to 30 minutes
        expect(appConfig.session.idleTimeout).toBe(1800000);
        // LLM provider defaults to anthropic
        expect(appConfig.llm.provider).toBe('anthropic');
        // Mutation delay defaults to 150ms
        expect(appConfig.mutation.delayMs).toBe(150);
        // Request timeout defaults to 2 minutes (120000ms)
        expect(appConfig.request.timeoutMs).toBe(120000);
        // Log level defaults to info
        expect(appConfig.logLevel).toBe('info');
    });
    it('should parse CORS_ORIGINS correctly when set to default', async () => {
        const { appConfig } = await import('../index.js');
        // Default should be '*' (allow all origins)
        expect(appConfig.cors.origins).toEqual(['*']);
    });
});
describe('loadSystemPrompt()', () => {
    it('should load the system prompt from scada-agent.md', async () => {
        const prompt = await loadSystemPrompt();
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
        expect(prompt.trim()).toBeTruthy();
    });
    it('should load the prompt with proper formatting', async () => {
        const prompt = await loadSystemPrompt();
        // The prompt file should be a valid markdown file with some content
        const hasContent = prompt.trim().length > 0;
        expect(hasContent).toBe(true);
    });
    it('should return consistent content on multiple calls', async () => {
        const prompt1 = await loadSystemPrompt();
        const prompt2 = await loadSystemPrompt();
        // Should return the same content on multiple calls
        expect(prompt1).toBe(prompt2);
    });
});
//# sourceMappingURL=index.test.js.map