import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();
const app = express();
// set a sane default port
const PORT = process.env.PORT || 5001;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
import { appointmentRouter } from "./routes/appointment.route.js";
import { slotRouter } from "./routes/slot.route.js";
import { appointmentModel } from "./models/appointment.model.js";
import cors from "cors";
import { authMiddleware } from "./utils/authMiddleware.js";
import cookieParser from "cookie-parser";
import { adminAppointmentRouter } from "./routes/admin.route.js";

app.use(cookieParser());

const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_PORT,
    process.env.ADMIN_URL
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));




// Log every request
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`
    );
  });

  next();
});

// simple health check
app.get("/health", (req, res) => res.status(200).json({ message: 'Working' }));




// mount routes (authMiddleware still applied if you require it)
app.use("/appointment", authMiddleware, appointmentRouter);
app.use("/slots", slotRouter);
app.use("/admin", adminAppointmentRouter);

// connect DB then start server
const start = async () => {
  try {
    console.log(process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL);
    await appointmentModel.syncIndexes();
    console.log("DB is connected");
    app.listen(PORT, () => {
      console.log(`Appointment App is listening on PORT ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start appointment service:", err);
    process.exit(1);
  }
};

start();






