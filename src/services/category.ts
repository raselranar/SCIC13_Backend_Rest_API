import { Router } from "express";
import { prisma } from "../lib/prisma";

const categoryRouter = Router();

// creating a new category
categoryRouter.post("/", async (req, res) => {
    try {
        const { name } = req.body;


        // Validate required fields
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        // check name is already exist or not
        if (name) {
            const existingCategory = await prisma.category.findFirst({
                where: { name: name.trim() },
            });


            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Category name already exists",
                });
            }
        }


        const data = await prisma.category.create({ data: { name: name.trim() } }); res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: data,
        })
    } catch (error: any) {
        console.error("Error creating category:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create category",
            error: error.message,
        });
    }
});

// get all categories
categoryRouter.get("/", async (req, res) => {
    try {
        console.log(req.query)
        const data = await prisma.category.findMany({
            where: { isDeleted: false },
            include: { products: true },
        });
        res.status(200).json({
            success: true,
            message: "Categories retrieved successfully",
            data: data,
        });
    } catch (error: any) {
        console.error("Error retrieving categories:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve categories",
            error: error.message,
        });
    }
});

// update category by id
categoryRouter.patch("/:id", async (req, res) => {
    try {
        const categoryId = req.params.id as string;
        const { name } = req.body;

        // Validate required fields
        if (!categoryId || categoryId.trim().length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category ID is required",
            });
        }
        const existing = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        if (!name || name.trim().length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category name is required",
            });
        }
        // check name is already exist or not
        if (name) {
            const existingCategory = await prisma.category.findFirst({
                where: { name: name.trim() },
            });


            if (existingCategory && existingCategory.id !== categoryId) {
                return res.status(400).json({
                    success: false,
                    message: "Category name already exists",
                });
            }
        }



        const data = await prisma.category.update({
            where: { id: categoryId, isDeleted: false },
            data: name ? { name: name.trim() } : {},
        });

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: data,
        });
    } catch (error: any) {
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
        console.error("Error updating category:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update category",
            error: error.message,
        });
    }
});

// delete category by id
categoryRouter.delete("/:id", async (req, res) => {
    try {
        const categoryId = req.params.id as string;

        const permanentDelete = req.query.permanent === "true";
        // validate categoryId
        if (!categoryId) {
            return res.status(404).json({
                success: false,
                message: "Category ID is required",
            });
        }


        if (permanentDelete) {
            const data = await prisma.category.delete({
                where: { id: categoryId },
            });
            return res.status(200).json({
                success: true,
                message: "Category permanently deleted successfully",
                data: data,
            });
        }
        const data = await prisma.category.update({
            where: { id: categoryId },
            data: { isDeleted: true },
        });

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            data: data,
        });
    }
    catch (error: any) {
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
        console.error("Error deleting category:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete category",
            error: error.message,
        });
    }
});

export default categoryRouter;