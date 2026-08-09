import { NextFunction, Request, Response } from "express";
import app from "./app";
import  'dotenv/config'
const PORT = process.env.PORT || 5000;

// --- GLOBAL ERROR HANDLER IN TS ---
app.use((err:any, req:Request, res:Response, next:NextFunction ) => {
    console.error(err.stack);
    
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
})




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
