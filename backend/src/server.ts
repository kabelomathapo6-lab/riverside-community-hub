// src/server.ts
//
// The API entry point. For now it's a skeleton: health check + the
// middleware stack + placeholders where each feature's routes will mount
// as we build them stage by stage (auth, bookings, donations, admin).

import donationRoutes from "./routes/donations";
import campaignRoutes from "./routes/campaigns";
import notificationRoutes from "./routes/notifications";
import bookingRoutes from "./routes/bookings";
import resourceRoutes from "./routes/resources";
import profileRoutes from "./routes/profiles";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { logger } from "./middleware/logger";
import { errorHandler, httpError } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: allow only our known frontends. Localhost for development, the
// deployed Vercel site for production, plus any extra origins listed in the
// ALLOWED_ORIGINS env var (comma separated). Requests with no origin (like
// health checks or curl) are allowed through.
const allowedOrigins = [
  "http://localhost:5173",
  "https://riverside-community-hub.vercel.app",
  ...(process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? []),
];
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin not allowed by CORS: ${origin}`));
      }
    },
  }),
);
app.use(express.json());
app.use(logger);

// Health check — a simple way to confirm the API is alive once deployed.
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "riverside-hub-api" });
});

// ---- Feature routes mount here as we build them ----
// app.use("/api/auth", authRoutes);
app.use("/donations", donationRoutes);
app.use("/campaigns", campaignRoutes);
app.use("/notifications", notificationRoutes);
app.use("/profiles", profileRoutes);
app.use("/resources", resourceRoutes);
app.use("/bookings", bookingRoutes);
// app.use("/api/bookings", bookingRoutes);
// app.use("/api/donations", donationRoutes);
// app.use("/api/admin", adminRoutes);

// 404 for anything unmatched, then the single error handler last.
app.use((req, res, next) => {
  next(httpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Riverside Hub API listening on http://localhost:${PORT}`);
});
