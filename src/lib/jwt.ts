import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_SECRET || "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

export interface AccessTokenPayload {
    sub: string;
    email: string;
    role: string;
}

export const signAccessToken = (payload: AccessTokenPayload): string =>
    jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN } as jwt.SignOptions);

export const verifyAccessToken = (token: string): AccessTokenPayload =>
    jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;

export const signRefreshToken = (payload: AccessTokenPayload): string =>
    jwt.sign({ ...payload, jti: crypto.randomUUID() }, REFRESH_SECRET, {
        expiresIn: Math.floor(REFRESH_EXPIRES_IN_MS / 1000),
    });

export const verifyRefreshToken = (token: string): AccessTokenPayload & { jti: string } =>
    jwt.verify(token, REFRESH_SECRET) as AccessTokenPayload & { jti: string };

export const hashRefreshToken = (token: string): string =>
    crypto.createHash("sha256").update(token).digest("hex");

export const refreshTokenExpiresAt = (): Date => new Date(Date.now() + REFRESH_EXPIRES_IN_MS);
