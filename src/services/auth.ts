import { Router } from "express";
import { prisma } from "../lib/prisma";
import { comparePassword, hashPassword } from "../lib/passwordHash";
import {
    hashRefreshToken,
    refreshTokenExpiresAt,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from "../lib/jwt";
import { authenticate } from "../middleware/auth";

const authRouter = Router();

const safeUser = {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true,
} as const;

// POST /api/auth/register
authRouter.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
        }

        const existing = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Email already exists",
            });
        }

        const passwordHash = await hashPassword(password);
        const data = await prisma.user.create({
            data: { name, email, password: passwordHash, role: "USER" },
            select: safeUser,
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data,
        });
    } catch (error: any) {
        console.error("Error registering user:", error);
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Email already exists",
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to register user",
        });
    }
});

// POST /api/auth/login
authRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.isDeleted) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: hashRefreshToken(refreshToken),
                expiresAt: refreshTokenExpiresAt(),
            },
        });

        res.json({
            success: true,
            message: "Login successful",
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    } catch (error: any) {
        console.error("Error logging in:", error);
        res.status(500).json({
            success: false,
            message: "Failed to login",
        });
    }
});

// POST /api/auth/refresh
authRouter.post("/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token",
            });
        }

        const stored = await prisma.refreshToken.findUnique({
            where: { tokenHash: hashRefreshToken(refreshToken) },
        });
        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            return res.status(401).json({
                success: false,
                message: "Refresh token has been revoked or expired",
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user || user.isDeleted) {
            return res.status(401).json({
                success: false,
                message: "User no longer exists",
            });
        }

        // rotate: revoke the used token, issue a fresh pair
        await prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });

        const newPayload = { sub: user.id, email: user.email, role: user.role };
        const newAccessToken = signAccessToken(newPayload);
        const newRefreshToken = signRefreshToken(newPayload);

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: hashRefreshToken(newRefreshToken),
                expiresAt: refreshTokenExpiresAt(),
            },
        });

        res.json({
            success: true,
            message: "Token refreshed",
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            },
        });
    } catch (error: any) {
        console.error("Error refreshing token:", error);
        res.status(500).json({
            success: false,
            message: "Failed to refresh token",
        });
    }
});

// POST /api/auth/logout
authRouter.post("/logout", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        await prisma.refreshToken.updateMany({
            where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
            data: { revokedAt: new Date() },
        });

        res.json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error: any) {
        console.error("Error logging out:", error);
        res.status(500).json({
            success: false,
            message: "Failed to logout",
        });
    }
});

// GET /api/auth/me
authRouter.get("/me", authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: safeUser,
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        res.json({
            success: true,
            message: "User fetched successfully",
            data: user,
        });
    } catch (error: any) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user",
        });
    }
});

export default authRouter;
