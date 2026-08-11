import { Router } from "express";
import { prisma } from "../lib/prisma";

const cartItemRouter = Router();

// create cart item
cartItemRouter.post("/", async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: userId and productId are required.",
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than zero.",
            });
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${product.stock}`,
            });
        }

        const existingCartItem = await prisma.cartItem.findFirst({
            where: {
                userId,
                productId,
            },
        });
        let cartItem;

        if (existingCartItem) {
            // Update existing cart item quantity
            const newQuantity = existingCartItem.quantity + quantity;

            // Check if new quantity exceeds stock
            if (newQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add more. Available: ${product.stock}, Already in cart: ${existingCartItem.quantity}`,
                });
            }

            cartItem = await prisma.cartItem.update({
                where: {
                    userId_productId: {
                        userId,
                        productId,
                    },
                },
                data: {
                    quantity: newQuantity,
                },
                include: {
                    product: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
        } else {
            // Create new cart item
            cartItem = await prisma.cartItem.create({
                data: {
                    userId,
                    productId,
                    quantity,
                },
                include: {
                    product: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
        }
        // Return success response
        res.status(201).json({
            success: true,
            message: existingCartItem ? "Cart item updated" : "Item added to cart",
            data: cartItem,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Error adding item to cart",
            error: error.message,
        });
    }
});

cartItemRouter.get("/", async (req, res) => {
    try {
        // Extract user ID filter from query parameters
        const userId = req.query.userId as string | undefined;

        // Build filter condition
        const whereCondition: any = {};
        if (userId) {
            whereCondition.userId = userId;
        }

        // Fetch cart items from database
        const cartItems = await prisma.cartItem.findMany({
            where: whereCondition,
            include: {
                product: {
                    include: {
                        category: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Calculate total cart value if filtering by user
        let totalCartValue = 0;
        if (userId) {
            totalCartValue = cartItems.reduce((sum: number, item: any) => {
                return sum + item.product.price * item.quantity;
            }, 0);
        }

        // Return success response
        res.status(200).json({
            success: true,
            message: "Cart items fetched successfully",
            data: cartItems,
            ...(userId && { totalCartValue: parseFloat(totalCartValue.toFixed(2)) }),
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Error fetching cart items",
            error: error.message,
        });
    }
});

cartItemRouter.patch("/:id", async (req, res) => {
    try {
        // Extract cart item ID from URL parameters and cast to string
        const id = req.params.id as string;
        // Extract new quantity from request body
        const { quantity } = req.body;

        // Validate quantity
        if (quantity === undefined || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0",
            });
        }

        // Find cart item and its product
        const cartItem = await prisma.cartItem.findUnique({
            where: { id },
            include: { product: true },
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found",
            });
        }

        // Check if product has sufficient stock
        if (quantity > cartItem.product.stock) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${cartItem.product.stock}`,
            });
        }

        // Update cart item quantity
        const updatedCartItem = await prisma.cartItem.update({
            where: { id },
            data: { quantity },
            include: {
                product: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Return success response
        res.status(200).json({
            success: true,
            message: "Cart item updated successfully",
            data: updatedCartItem,
        });
    } catch (error: any) {
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Cart item not found",
            });
        }

        res.status(500).json({
            success: false,
            message: "Error updating cart item",
            error: error.message,
        });
    }
});

// delete cart item by id
cartItemRouter.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id as string;

        // Check if the cart item exists
        const existingCartItem = await prisma.cartItem.findUnique({ where: { id } });
        if (!existingCartItem) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found",
            });
        }

        // Delete the cart item
        await prisma.cartItem.delete({ where: { id } });

        res.status(200).json({
            success: true,
            message: "Cart item deleted successfully",
        });
    } catch (error: any) {
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Cart item not found",
            });
        }

        res.status(500).json({
            success: false,
            message: "Error deleting cart item",
            error: error.message,
        });
    }
});

export default cartItemRouter;