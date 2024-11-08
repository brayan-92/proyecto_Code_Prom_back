import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import router from './routes/userRoutes.js';
import { connect } from './mongodb.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

const corsOptions = {
  origin: "https://proyecto-code-prom-front.vercel.app",
  methods: ["GET", "POST", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use('/api', router);
app.get ('/', async (req, res) => {
  res.send('backend desplegado');
});

connect();



app.listen(PORT, () => {
  console.log('Server running on port ${port}');
});
