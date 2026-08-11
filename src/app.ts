import express from 'express';
import cors from 'cors';
import path from 'path';
import "dotenv/config";
import router from './routes';
const app = express();
// middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/api/", router)

// routes
app.get('/', (req, res) => {
  res.send('server is running');
});

export default app;
