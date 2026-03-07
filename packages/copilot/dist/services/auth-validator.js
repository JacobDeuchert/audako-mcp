import https from 'node:https';
import { BaseHttpService, UserProfileHttpService } from 'audako-core';
import axios from 'axios';
// Allow self-signed certificates for internal SCADA endpoints.
axios.defaults.httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});
/** Thrown when upstream token validation fails. */
export class UpstreamAuthError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.name = 'UpstreamAuthError';
        this.statusCode = statusCode;
    }
}
/**
 * Validates an upstream access token by requesting the user profile
 * from the Audako API at the given `scadaUrl`.
 *
 * Throws `UpstreamAuthError` on failure with the appropriate HTTP status code.
 */
export async function validateUpstreamToken(scadaUrl, accessToken) {
    try {
        const httpConfig = await BaseHttpService.requestHttpConfig(scadaUrl);
        const userProfileService = new UserProfileHttpService(httpConfig, accessToken);
        const profile = await userProfileService.getUserProfile();
        if (!profile?.UserId) {
            throw new UpstreamAuthError(401, 'Invalid or unauthorized access token');
        }
    }
    catch (error) {
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
        // Network / timeout / unexpected errors
        const isNetwork = isUpstreamNetworkError(error);
        throw new UpstreamAuthError(isNetwork ? 503 : 401, isNetwork
            ? 'Upstream authentication service is unavailable'
            : 'Invalid or unauthorized access token');
    }
}
function isUpstreamNetworkError(error) {
    if (axios.isAxiosError(error)) {
        return !error.response && Boolean(error.code);
    }
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        return (msg.includes('econnrefused') ||
            msg.includes('enotfound') ||
            msg.includes('etimedout') ||
            msg.includes('fetch failed'));
    }
    return false;
}
//# sourceMappingURL=auth-validator.js.map