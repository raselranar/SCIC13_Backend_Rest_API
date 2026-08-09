import { Router } from "express";

const productRouter = Router();

productRouter.get("/", (req, res) => {
  res.send("Products route is working");
});

export default productRouter;