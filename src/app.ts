import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import "dotenv/config";
import router from './routes';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
