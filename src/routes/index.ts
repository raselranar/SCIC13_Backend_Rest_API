import { Router } from "express";
import productRouter from "../services/products";
import userRouter from "../services/users";
import categoryRouter from "../services/category";
import orderRouter from "../services/order";
import cartItemRouter from "../services/cartItems";
import authRouter from "../services/auth";

const router = Router();

router.use("/auth", authRouter);
router.use("/products", productRouter);
router.use("/users", userRouter);
router.use("/categories", categoryRouter);
router.use("/orders", orderRouter);
router.use("/cart-items", cartItemRouter);

export default router;