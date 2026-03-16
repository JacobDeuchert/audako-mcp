import https from 'node:https';
import { BaseHttpService, UserProfileHttpService } from 'audako-core';
import axios from 'axios';

const allowSelfSignedHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
axios.defaults.httpsAgent = allowSelfSignedHttpsAgent;

export class UpstreamAuthError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'UpstreamAuthError';
    this.statusCode = statusCode;
  }
}

export async function validateUpstreamToken(scadaUrl: string, accessToken: string): Promise<void> {
  try {
    const httpConfig = await BaseHttpService.requestHttpConfig(scadaUrl);
    const userProfileService = new UserProfileHttpService(httpConfig, accessToken);
    const profile = await userProfileService.getUserProfile();

    if (!profile?.UserId) {
      throw new UpstreamAuthError(401, 'Invalid or unauthorized access token');
    }
  } catch (error) {
    if (error instanceof UpstreamAuthError) {
      throw error;
    }

    const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;

    if (statusCode === 403) {
      throw new UpstreamAuthError(403, 'Access forbidden');
    }

    if (statusCode === 401) {
      throw new UpstreamAuthError(401, 'Invalid or unauthorized access token');
    }

    const isNetwork = isUpstreamNetworkError(error);

    throw new UpstreamAuthError(
      isNetwork ? 503 : 401,
      isNetwork
        ? 'Upstream authentication service is unavailable'
        : 'Invalid or unauthorized access token',
    );
  }
}

function isUpstreamNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response && Boolean(error.code);
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('econnrefused') ||
      msg.includes('enotfound') ||
      msg.includes('etimedout') ||
      msg.includes('fetch failed')
    );
  }

  return false;
}
