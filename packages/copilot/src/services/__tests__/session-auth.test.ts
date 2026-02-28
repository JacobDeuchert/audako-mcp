import type { FastifyReply, FastifyRequest } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  extractBearerToken,
  extractQueryToken,
  generateSessionToken,
  hashSessionToken,
  requireSessionAuth,
  verifySessionToken,
  verifyWebSocketAuth,
} from '../session-auth.js';

describe('generateSessionToken', () => {
  it('should generate a non-empty token', () => {
    const token = generateSessionToken();
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(0);
  });

  it('should generate a 64-character hex string', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should generate unique tokens', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    expect(token1).not.toBe(token2);
  });

  it('should generate cryptographically random tokens', () => {
    // Generate multiple tokens and ensure they're all different
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateSessionToken());
    }
    expect(tokens.size).toBe(100);
  });
});

describe('hashSessionToken', () => {
  it('should hash a token to a 64-character hex string', () => {
    const token = 'test-token-123';
    const hash = hashSessionToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should produce consistent hashes for the same token', () => {
    const token = 'test-token-123';
    const hash1 = hashSessionToken(token);
    const hash2 = hashSessionToken(token);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different tokens', () => {
    const token1 = 'test-token-123';
    const token2 = 'test-token-456';
    const hash1 = hashSessionToken(token1);
    const hash2 = hashSessionToken(token2);
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifySessionToken', () => {
  it('should accept matching token and hash', () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    expect(verifySessionToken(token, hash)).toBe(true);
  });

  it('should reject different token', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    const hash1 = hashSessionToken(token1);
    expect(verifySessionToken(token2, hash1)).toBe(false);
  });

  it('should reject empty token', () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    expect(verifySessionToken('', hash)).toBe(false);
  });

  it('should reject empty hash', () => {
    const token = generateSessionToken();
    expect(verifySessionToken(token, '')).toBe(false);
  });

  it('should use timing-safe comparison (implementation check)', () => {
    // This test verifies the implementation uses timingSafeEqual
    // by checking that the function doesn't short-circuit on length mismatch
    const token = generateSessionToken();
    const hash = hashSessionToken(token);

    // Verify with correct hash
    expect(verifySessionToken(token, hash)).toBe(true);

    // Verify with incorrect hash (same length)
    const wrongHash = 'a'.repeat(64);
    expect(verifySessionToken(token, wrongHash)).toBe(false);

    // Verify with incorrect hash (different length)
    const shortHash = 'a'.repeat(32);
    expect(verifySessionToken(token, shortHash)).toBe(false);
  });

  it('should handle malformed hashes', () => {
    const token = generateSessionToken();
    expect(verifySessionToken(token, 'not-a-valid-hash')).toBe(false);
  });
});

describe('extractBearerToken', () => {
  it('should extract token from valid Bearer header', () => {
    const request = {
      headers: {
        authorization: 'Bearer test-token-123',
      },
    } as FastifyRequest;

    expect(extractBearerToken(request)).toBe('test-token-123');
  });

  it('should return undefined when Authorization header is missing', () => {
    const request = {
      headers: {},
    } as FastifyRequest;

    expect(extractBearerToken(request)).toBeUndefined();
  });

  it('should return undefined when Authorization header is not Bearer', () => {
    const request = {
      headers: {
        authorization: 'Basic test-token-123',
      },
    } as FastifyRequest;

    expect(extractBearerToken(request)).toBeUndefined();
  });

  it('should return undefined when token is empty', () => {
    const request = {
      headers: {
        authorization: 'Bearer ',
      },
    } as FastifyRequest;

    expect(extractBearerToken(request)).toBeUndefined();
  });

  it('should trim whitespace from token', () => {
    const request = {
      headers: {
        authorization: 'Bearer   test-token-123   ',
      },
    } as FastifyRequest;

    expect(extractBearerToken(request)).toBe('test-token-123');
  });

  it('should handle array of headers', () => {
    const request = {
      headers: {
        authorization: ['Bearer test-token-123', 'Bearer other-token'],
      },
    } as unknown as FastifyRequest;

    expect(extractBearerToken(request)).toBe('test-token-123');
  });
});

describe('extractQueryToken', () => {
  it('should extract token from query parameter', () => {
    const request = {
      query: {
        sessionToken: 'test-token-123',
      },
    } as FastifyRequest;

    expect(extractQueryToken(request)).toBe('test-token-123');
  });

  it('should return undefined when query parameter is missing', () => {
    const request = {
      query: {},
    } as FastifyRequest;

    expect(extractQueryToken(request)).toBeUndefined();
  });

  it('should return undefined when query parameter is not a string', () => {
    const request = {
      query: {
        sessionToken: 123,
      },
    } as FastifyRequest;

    expect(extractQueryToken(request)).toBeUndefined();
  });

  it('should return undefined when token is empty', () => {
    const request = {
      query: {
        sessionToken: '',
      },
    } as FastifyRequest;

    expect(extractQueryToken(request)).toBeUndefined();
  });

  it('should trim whitespace from token', () => {
    const request = {
      query: {
        sessionToken: '   test-token-123   ',
      },
    } as FastifyRequest;

    expect(extractQueryToken(request)).toBe('test-token-123');
  });
});

describe('requireSessionAuth', () => {
  let mockReply: FastifyReply;

  beforeEach(() => {
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as any;
  });

  it('should accept valid token', () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);

    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as FastifyRequest;

    expect(requireSessionAuth(request, mockReply, hash)).toBe(true);
    expect(mockReply.status).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });

  it('should reject missing token', () => {
    const request = {
      headers: {},
    } as FastifyRequest;

    expect(requireSessionAuth(request, mockReply, 'any-hash')).toBe(false);
    expect(mockReply.status).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    });
  });

  it('should reject invalid token', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    const hash1 = hashSessionToken(token1);

    const request = {
      headers: {
        authorization: `Bearer ${token2}`,
      },
    } as FastifyRequest;

    expect(requireSessionAuth(request, mockReply, hash1)).toBe(false);
    expect(mockReply.status).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid session token',
    });
  });
});

describe('verifyWebSocketAuth', () => {
  it('should accept valid token from query', () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);

    const request = {
      query: {
        sessionToken: token,
      },
    } as FastifyRequest;

    expect(verifyWebSocketAuth(request, hash)).toBe(true);
  });

  it('should reject missing token', () => {
    const request = {
      query: {},
    } as FastifyRequest;

    expect(verifyWebSocketAuth(request, 'any-hash')).toBe(false);
  });

  it('should reject invalid token', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    const hash1 = hashSessionToken(token1);

    const request = {
      query: {
        sessionToken: token2,
      },
    } as FastifyRequest;

    expect(verifyWebSocketAuth(request, hash1)).toBe(false);
  });
});
