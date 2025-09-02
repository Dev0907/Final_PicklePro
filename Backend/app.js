import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import authRoutes from "./routes/authRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import joinRequestRoutes from "./routes/joinRequestRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import courtRoutes from "./routes/courtRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
// import maintenanceRoutes from './routes/maintenanceRoutes.js'; // TODO: Implement maintenance routes
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { initializeSocket } from "./config/socket-redis.js";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend server is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/join-requests", joinRequestRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
// app.use('/api/maintenance', maintenanceRoutes); // TODO: Implement maintenance routes
app.use("/api/analytics", analyticsRoutes);

const PORT = process.env.PORT || 5000;

// Initialize Socket.io with Redis and start server
const startServer = async () => {
  try {
    const io = await initializeSocket(server);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.io server with Redis initialized`);
    });
  } catch (error) {
    console.error("Failed to initialize server with Redis:", error);
    console.log("Falling back to non-Redis socket configuration...");

    // Fallback to non-Redis configuration
    const { initializeSocket: initializeSocketNoRedis } = await import(
      "./config/socket-no-redis.js"
    );
    const io = initializeSocketNoRedis(server);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.io server initialized (fallback mode)`);
    });
  }
};

startServer();
