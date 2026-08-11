import { Request, Router } from "express";
import { prisma } from "../lib/prisma";

const productRouter = Router();
// add new product
productRouter.post("/", async (req: Request, res) => {
    try {
        const { name, description, price, stock, categoryId } = req.body;
        console.log("Received product data:", { name, description, price, stock, categoryId });
        if (!name || typeof price === "undefined" || price === null || !categoryId || typeof stock === "undefined" || stock === null) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        if (price <= 0 || stock < 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be greater than 0 and stock cannot be negative",
            });
        }

        // verify if category exists
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const data = await prisma.product.create({ data: { name, description, price, stock, categoryId }, include: { category: true } });
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

// get all products
productRouter.get("/", async (req, res) => {
    try {
        const products = await prisma.product.findMany({ where: { isDeleted: false }, include: { category: true } });
        res.json({
            success: true,
            message: "Products retrieved successfully",
            data: products,
        });
    } catch (error: any) {
        console.error("Error retrieving products:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve products",
            error: error.message,
        });
    }
});
// get product by id
productRouter.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({ where: { id, isDeleted: false }, include: { category: true } });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        res.json({
            success: true,
            message: "Product retrieved successfully",
            data: product,
        });
    } catch (error: any) {
        console.error("Error retrieving product:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve product",
            error: error.message,
        });
    }
});
// update product by id
productRouter.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, categoryId } = req.body;

        // verify if product exists
        const existingProduct = await prisma.product.findUnique({ where: { id, isDeleted: false } });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // verify if category exists
        if (categoryId) {
            const category = await prisma.category.findUnique({ where: { id: categoryId } });
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found",
                });
            }
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { name, description, price, stock, categoryId },
            include: { category: true },
        });

        res.json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct,
        });
    } catch (error: any) {
        console.error("Error updating product:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: error.message,
        });
    }
});
// delete product by id
productRouter.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // verify if product exists
        const existingProduct = await prisma.product.findUnique({ where: { id, isDeleted: false } });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        await prisma.product.update({ where: { id }, data: { isDeleted: true } });

        res.json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete product",
            error: error.message,
        });
    }
});


export default productRouter;