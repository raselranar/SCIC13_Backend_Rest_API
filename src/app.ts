import express from 'express';
import cors from 'cors';
import "dotenv/config";
const app = express();
// middleware
app.use(cors());
app.use(express.json());

// routes
app.get('/', (req, res) => {
  res.send('server is running');
});

export default app;
