import { Router } from "express";
import { prisma } from "../lib/prisma";

const userRouter = Router();

userRouter.post("/", async (req, res) => {
    try {
        const usersData = req.body;
        console.log("Received user data:", usersData);
        const data = await prisma.user.create({ data: { ...usersData } });
        res.json({
            success: true,
            message: "User created successfully",
            data: data,
        })
    } catch (error: any) {
        console.error("Error creating user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create user",
            error: error.message,
        });
    }
});

export default userRouter;