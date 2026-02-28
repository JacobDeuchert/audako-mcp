import { describe, expect, it } from 'vitest';
import { createMutationThrottle, resolveMutationDelayMs } from '../mutation-throttle.js';
function wait(delayMs) {
    return new Promise(resolve => {
        setTimeout(resolve, delayMs);
    });
}
describe('resolveMutationDelayMs', () => {
    it('defaults to 150ms when env var is not set', () => {
        expect(resolveMutationDelayMs({})).toBe(150);
    });
    it('uses AUDAKO_MUTATION_DELAY_MS when valid', () => {
        expect(resolveMutationDelayMs({ AUDAKO_MUTATION_DELAY_MS: '225' })).toBe(225);
    });
    it('falls back to default when env var is invalid', () => {
        expect(resolveMutationDelayMs({ AUDAKO_MUTATION_DELAY_MS: '-1' })).toBe(150);
        expect(resolveMutationDelayMs({ AUDAKO_MUTATION_DELAY_MS: 'nope' })).toBe(150);
    });
});
describe('createMutationThrottle', () => {
    it('serializes concurrent mutations and enforces delay between executions', async () => {
        const delayMs = 50;
        const throttle = createMutationThrottle(delayMs);
        const starts = [];
        const finishes = [];
        let active = 0;
        let maxActive = 0;
        const mutation = async (label) => {
            return throttle.run(async () => {
                starts.push(Date.now());
                active += 1;
                maxActive = Math.max(maxActive, active);
                await wait(20);
                active -= 1;
                finishes.push(Date.now());
                return label;
            });
        };
        const [one, two, three] = await Promise.all([
            mutation('one'),
            mutation('two'),
            mutation('three'),
        ]);
        expect([one, two, three]).toEqual(['one', 'two', 'three']);
        expect(maxActive).toBe(1);
        expect(starts).toHaveLength(3);
        expect(finishes).toHaveLength(3);
        expect(starts[1] - finishes[0]).toBeGreaterThanOrEqual(delayMs - 1);
        expect(starts[2] - finishes[1]).toBeGreaterThanOrEqual(delayMs - 1);
    });
});
//# sourceMappingURL=mutation-throttle.test.js.map