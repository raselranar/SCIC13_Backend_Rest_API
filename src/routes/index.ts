import { Router } from "express";
import productRouter from "../services/products";
import userRouter from "../services/users";
import categoryRouter from "../services/category";
import orderRouter from "../services/order";

const router = Router();

router.use("/products", productRouter);
router.use("/users", userRouter);
router.use("/categories", categoryRouter);
router.use("/orders", orderRouter);

export default router;