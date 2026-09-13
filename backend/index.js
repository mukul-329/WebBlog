import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import postRoutes from './routes/posts.js';
import userRoutes from './routes/user.js';

const app = express();

app.use(bodyParser.json({ limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));

// The production browser talks to Nginx on the same origin. CORS is only needed
// when deliberately enabling a separate development frontend through CLIENT_ORIGIN.
if (process.env.CLIENT_ORIGIN) {
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
}

app.use('/posts', postRoutes);
app.use('/user', userRoutes);
const PORT = process.env.PORT || 5000;

mongoose.set('strictQuery', false); 
mongoose
  .connect(process.env.CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true }) // Ensuring compatibility with new MongoDB driver
  .then(() => 
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`))
  )
  .catch((error) => console.log(error.message));
