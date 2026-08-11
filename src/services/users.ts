import { Router } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/passwordHash";

const userRouter = Router();

// register user
userRouter.post("/", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
        }
        const passwordHash = await hashPassword(password);

        const data = await prisma.user.create({ data: { name, email, password: passwordHash, role: "USER" } });
        res.json({
            success: true,
            message: "User created successfully",
            data: data,
        })
    } catch (error: any) {
        console.error("Error creating user:", error);
        // handle duplicate email error
        if (error.code === "P2002" && error.meta?.target?.includes("email")) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to create user",
            error: error.message,
        });
    }
});
// get all users
userRouter.get("/", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { isDeleted: false },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json({
            success: true,
            message: "Users retrieved successfully",
            data: users,
        });
    } catch (error: any) {
        console.error("Error retrieving users:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve users",
            error: error.message,
        });
    }
});

// get user by id
userRouter.get("/:id", async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        const user = await prisma.user.findUnique({
            where: { id, isDeleted: false },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                isDeleted: true,
                orders: {
                    where: { isDeleted: false },
                },
                cartItems: true,
            },

        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if user is soft-deleted
        if (user.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "User not found (deleted)",
            });
        }


        res.json({
            success: true,
            message: "User retrieved successfully",
            data: user,
        });
    } catch (error: any) {
        console.error("Error retrieving user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve user",
            error: error.message,
        });
    }
});

//  update user by id
userRouter.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        const { name, email, password, role } = req.body;

        // Check if user exists and is not soft-deleted
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser || existingUser.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Prepare the data to update
        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password) {
            const passwordHash = await hashPassword(password);
            updateData.password = passwordHash;
        }
        if (role) updateData.role = role;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    } catch (error: any) {
        console.error("Error updating user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update user",
            error: error.message,
        });
    }
});

// delete user by id
userRouter.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params as { id: string };

        // Check if user exists and is not soft-deleted
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser || existingUser.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Soft delete the user
        await prisma.user.update({
            where: { id },
            data: { isDeleted: true },
        });

        res.json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: error.message,
        });
    }
});


export default userRouter;