import "dotenv/config";
// Core libraries
import express from 'express';
import cors from 'cors';
// Database
import db from "./config/db.js";
// Middlewares
import loggerHandling from './middlewares/loggerHandling.js';
import errorHandling from './middlewares/errorHandling.js';
import notFoundHandling from './middlewares/notFoundHandling.js';
// Routes
import accountRoutes from './routes/accountRoutes.js';
import authRoutes from './routes/authRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import notifRoutes from './routes/notifRoutes.js';
import commentRoutes from './routes/commentRoutes.js';

const app = express();
const PORT = process.env.PORT || 1000;

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(loggerHandling);
app.use(express.json());

async function testDbConnection() {
    try {
        console.log("Testing database connection...");

        const result = await db.query("SELECT NOW()");

        console.log("PostgreSQL connection successful:");
        console.log(result.rows[0]);

    } catch (err) {
        console.error("Database connection failed:");
        console.error(err);

        process.exit(1);
    }
}

// 🔥 2-second delay for EVERYTHING
// app.use((req, res, next) => {
//     setTimeout(() => {
//         next();
//     }, 1000);
// });

app.use("/api/auth", authRoutes);
app.use("/api/story", storyRoutes);
app.use("/api/notifications", notifRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/comment", commentRoutes);

app.use(errorHandling);
app.use(notFoundHandling);

app.listen(PORT, async () => {
    console.log(`server is running on port ${PORT}`);
    await testDbConnection();
});