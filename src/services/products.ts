import { Router } from "express";
import { prisma } from "../lib/prisma";

const productRouter = Router();

productRouter.post("/product", async (req, res) => {
    try {
        const productData = req.body;
        console.log("Received product data:", productData);
        const data = await prisma.product.create({ data: { ...productData } });
        res.json({
            success: true,
            message: "Product created successfully",
            data: data,
        })
    } catch (error: any) {
        console.error("Error creating product:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: error.message,
        });
    }
});

export default productRouter;