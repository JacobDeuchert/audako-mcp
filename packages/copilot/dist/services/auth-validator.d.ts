/** Thrown when upstream token validation fails. */
export declare class UpstreamAuthError extends Error {
    readonly statusCode: number;
    constructor(statusCode: number, message: string);
}
/**
 * Validates an upstream access token by requesting the user profile
 * from the Audako API at the given `scadaUrl`.
 *
 * Throws `UpstreamAuthError` on failure with the appropriate HTTP status code.
 */
export declare function validateUpstreamToken(scadaUrl: string, accessToken: string): Promise<void>;
//# sourceMappingURL=auth-validator.d.ts.map