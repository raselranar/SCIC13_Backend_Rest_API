import { Router } from "express";
import { prisma } from "../lib/prisma";

const orderRouter = Router();

// create order
orderRouter.post("/", async (req, res) => {
    try {
        const { userId, totalAmount, shippingAddress } = req.body;
        const order = await prisma.order.create({
            data: {
                userId,
                totalAmount,
                shippingAddress: shippingAddress || null,
            },
        });
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
        const orders = await prisma.order.findMany({ where: { isDeleted: false }, include: { user: true } });
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
        const order = await prisma.order.findUnique({ where: { id, isDeleted: false }, include: { user: true } });
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
// update order by id
orderRouter.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { totalAmount, shippingAddress } = req.body;

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
            },
        });

        res.json({ success: true, message: 'Order updated successfully', data: updated });
    } catch (error: any) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, message: 'Failed to update order', error: error.message });
    }
});
export default orderRouter;