import { Router } from "express";
import { prisma } from "../lib/prisma";

const orderRouter = Router();

// create order
orderRouter.post("/", async (req, res) => {
    try {
        const { userId, cartItems } = req.body;

        if (!userId || cartItems === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: userId and cartItems are required.",
            });
        }
        let itemsToOrder = cartItems;

        if (!itemsToOrder || itemsToOrder.length === 0) {
            // Fetch user's cart items if not provided
            const userCart = await prisma.cartItem.findMany({
                where: { userId },
                include: { product: true },
            });

            if (userCart.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Cart is empty. Add items before creating order",
                });
            }

            // Convert cart items to order items format
            itemsToOrder = userCart.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price,
            }));
        }

        // Validate and calculate total amount
        let totalAmount = 0;
        const validatedItems = [];

        for (const item of itemsToOrder) {
            if (!item.productId || !item.quantity || !item.price) {
                return res.status(400).json({
                    success: false,
                    message: "Each order item must have productId, quantity, and price",
                });
            }

            // Verify product exists and has stock
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.productId}`,
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
                });
            }

            totalAmount += item.price * item.quantity;
            validatedItems.push(item);
        }

        const order = await prisma.order.create({
            data: {
                userId,
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                status: "PENDING",
                orderItems: {
                    create: validatedItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                orderItems: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        // Clear user's cart after successful order creation
        if (!cartItems || cartItems.length === 0) {
            await prisma.cartItem.deleteMany({
                where: { userId },
            });
        }

        res.json({
            success: true,
            message: "Order created successfully",
            data: order,
        });
    } catch (error: any) {
        console.error("Error creating order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create order",
            error: error.message,
        });
    }
});
// get all orders
orderRouter.get("/", async (req, res) => {
    try {
        const userId = req.query.userId as string | undefined;
        let orders;
        if (userId) {
            orders = await prisma.order.findMany({
                where: { userId, isDeleted: false },
                include: {
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
            orders = await prisma.order.findMany({
                where: { isDeleted: false },
                include: {
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
        res.json({
            success: true,
            message: "Orders retrieved successfully",
            data: orders,
        });
    } catch (error: any) {
        console.error("Error retrieving orders:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve orders",
            error: error.message,
        });
    }
});

// get order by id
orderRouter.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id, isDeleted: false },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        res.json({
            success: true,
            message: "Order retrieved successfully",
            data: order,
        });
    } catch (error: any) {
        console.error("Error retrieving order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve order",
            error: error.message,
        });
    }
});

// get order items by order id
orderRouter.get("/:id/items", async (req, res) => {
    try {
        const { id } = req.params;
        const orderItems = await prisma.orderItem.findMany({
            where: { orderId: id },
            include: { product: true },
        });
        res.json({
            success: true,
            message: "Order items retrieved successfully",
            data: orderItems,
        });
    } catch (error: any) {
        console.error("Error retrieving order items:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve order items",
            error: error.message,
        });
    }
});
// update order by id
orderRouter.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { totalAmount, shippingAddress, status } = req.body;
        const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];
        if (status !== undefined && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid order status" });
        }
        const existing = await prisma.order.findUnique({ where: { id } });
        if (!existing || existing.isDeleted) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const updated = await prisma.order.update({
            where: { id },
            data: {
                // only update provided fields
                ...(totalAmount !== undefined && { totalAmount }),
                ...(shippingAddress !== undefined && { shippingAddress }),
                ...(status !== undefined && { status }),
            },
        });

        res.json({ success: true, message: 'Order updated successfully', data: updated });
    } catch (error: any) {

        console.error('Error updating order:', error);
        res.status(500).json({ success: false, message: 'Failed to update order', error: error.message });
    }
});

// delete order by id
orderRouter.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.order.findUnique({ where: { id } });
        if (!existing || existing.isDeleted) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Soft delete by setting isDeleted to true
        await prisma.order.update({
            where: { id },
            data: { isDeleted: true },
        });

        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting order:', error);
        res.status(500).json({ success: false, message: 'Failed to delete order', error: error.message });
    }
});


export default orderRouter;