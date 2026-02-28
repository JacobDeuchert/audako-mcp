import { BaseHttpService, UserProfileHttpService } from 'audako-core';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpstreamAuthError, validateUpstreamToken } from '../auth-validator.js';

// Mock audako-core
vi.mock('audako-core', () => ({
  BaseHttpService: {
    requestHttpConfig: vi.fn(),
  },
  UserProfileHttpService: vi.fn(),
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    defaults: {
      httpsAgent: undefined,
    },
    isAxiosError: vi.fn(),
  },
}));

describe('validateUpstreamToken', () => {
  const mockScadaUrl = 'https://scada-test.example.com';
  const mockAccessToken = 'test-access-token-123';
  const mockHttpConfig = {
    Services: {
      BaseUri: 'https://scada-test.example.com/api',
      Calendar: '',
      Camera: '',
      Driver: '',
      Event: '',
      Historian: '',
      Live: '',
      Maintenance: '',
      Messenger: '',
      Reporting: '',
      Structure: '',
    },
    Authentication: {
      BaseUri: 'https://scada-test.example.com/auth',
      ClientId: 'test-client',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept valid SCADA token with user profile', async () => {
    const mockProfile = {
      UserId: 'user-123',
      UserName: 'testuser',
      Email: 'test@example.com',
    };

    vi.mocked(BaseHttpService.requestHttpConfig).mockResolvedValue(mockHttpConfig);

    const mockGetUserProfile = vi.fn().mockResolvedValue(mockProfile);
    vi.mocked(UserProfileHttpService).mockImplementation(
      () =>
        ({
          getUserProfile: mockGetUserProfile,
        }) as any,
    );

    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).resolves.toBeUndefined();

    expect(BaseHttpService.requestHttpConfig).toHaveBeenCalledWith(mockScadaUrl);
    expect(UserProfileHttpService).toHaveBeenCalledWith(mockHttpConfig, mockAccessToken);
    expect(mockGetUserProfile).toHaveBeenCalled();
  });

  it('should reject token when user profile has no UserId', async () => {
    const mockProfile = {
      UserName: 'testuser',
      Email: 'test@example.com',
    };

    vi.mocked(BaseHttpService.requestHttpConfig).mockResolvedValue(mockHttpConfig);

    const mockGetUserProfile = vi.fn().mockResolvedValue(mockProfile);
    vi.mocked(UserProfileHttpService).mockImplementation(
      () =>
        ({
          getUserProfile: mockGetUserProfile,
        }) as any,
    );

    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).rejects.toThrow(
      UpstreamAuthError,
    );
    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or unauthorized access token',
    });
  });

  it('should reject token with 403 status on forbidden response', async () => {
    vi.mocked(BaseHttpService.requestHttpConfig).mockResolvedValue(mockHttpConfig);

    const mockGetUserProfile = vi.fn().mockRejectedValue({
      response: { status: 403 },
      isAxiosError: true,
    });
    vi.mocked(UserProfileHttpService).mockImplementation(
      () =>
        ({
          getUserProfile: mockGetUserProfile,
        }) as any,
    );
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).rejects.toThrow(
      UpstreamAuthError,
    );
    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Access forbidden',
    });
  });

  it('should reject token with 401 status on unauthorized response', async () => {
    vi.mocked(BaseHttpService.requestHttpConfig).mockResolvedValue(mockHttpConfig);

    const mockGetUserProfile = vi.fn().mockRejectedValue({
      response: { status: 401 },
      isAxiosError: true,
    });
    vi.mocked(UserProfileHttpService).mockImplementation(
      () =>
        ({
          getUserProfile: mockGetUserProfile,
        }) as any,
    );
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).rejects.toThrow(
      UpstreamAuthError,
    );
    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or unauthorized access token',
    });
  });

  it('should handle network errors with 503 status', async () => {
    vi.mocked(BaseHttpService.requestHttpConfig).mockResolvedValue(mockHttpConfig);

    const mockGetUserProfile = vi.fn().mockRejectedValue({
      code: 'ECONNREFUSED',
      isAxiosError: true,
    });
    vi.mocked(UserProfileHttpService).mockImplementation(
      () =>
        ({
          getUserProfile: mockGetUserProfile,
        }) as any,
    );
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).rejects.toThrow(
      UpstreamAuthError,
    );
    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).rejects.toMatchObject({
      statusCode: 503,
      message: 'Upstream authentication service is unavailable',
    });
  });

  it('should handle network errors from error message', async () => {
    vi.mocked(BaseHttpService.requestHttpConfig).mockResolvedValue(mockHttpConfig);

    const mockGetUserProfile = vi.fn().mockRejectedValue(new Error('Connection failed: ETIMEDOUT'));
    vi.mocked(UserProfileHttpService).mockImplementation(
      () =>
        ({
          getUserProfile: mockGetUserProfile,
        }) as any,
    );
    vi.mocked(axios.isAxiosError).mockReturnValue(false);

    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).rejects.toThrow(
      UpstreamAuthError,
    );
    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).rejects.toMatchObject({
      statusCode: 503,
      message: 'Upstream authentication service is unavailable',
    });
  });

  it('should handle unexpected errors with 401 status', async () => {
    vi.mocked(BaseHttpService.requestHttpConfig).mockResolvedValue(mockHttpConfig);

    const mockGetUserProfile = vi.fn().mockRejectedValue(new Error('Unexpected error'));
    vi.mocked(UserProfileHttpService).mockImplementation(
      () =>
        ({
          getUserProfile: mockGetUserProfile,
        }) as any,
    );
    vi.mocked(axios.isAxiosError).mockReturnValue(false);

    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).rejects.toThrow(
      UpstreamAuthError,
    );
    await expect(validateUpstreamToken(mockScadaUrl, mockAccessToken)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or unauthorized access token',
    });
  });
});
