import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import mongoose from "mongoose";
import User from "./models/User.js";
import Event from "./models/Event.js";
import { register, login, authMiddleware } from "./auth.js";
import upload from "./upload.js";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with explicit path and debug
dotenv.config({
  path: path.join(__dirname, "..", ".env"),
  debug: process.env.NODE_ENV !== "production",
});

const app = express();
const port = process.env.PORT || 4000;

// Enhanced CORS configuration to handle preflight requests
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://192.168.1.10:3000",
      "https://flow-ing.vercel.app",

      // Add patterns for your new Vercel deployment
      /^https:\/\/flow-ing-.*\.vercel\.app$/,
      /^https:\/\/kaizen-web3-app-.*\.vercel\.app$/,
      /^https:\/\/kaizen-x-.*\.vercel\.app$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200, // Support legacy browsers
  })
);

// Additional CORS handling for preflight requests
app.options('*', cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://192.168.1.10:3000",
    "https://flow-ing.vercel.app",
    /^https:\/\/flow-ing-.*\.vercel\.app$/,
    /^https:\/\/kaizen-web3-app-.*\.vercel\.app$/,
    /^https:\/\/kaizen-x-.*\.vercel\.app$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Debug middleware to log CORS requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from origin: ${req.get('Origin') || 'unknown'}`);
  if (req.method === 'OPTIONS') {
    console.log('Preflight request detected');
  }
  next();
});

const pool = new Pool();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// --- AUTH ---
app.post("/api/register", register);
app.post("/api/login", login);

// Get current user (protected)
app.get("/api/users/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});
// Event image upload (protected)
app.post(
  "/api/events/:id/image",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No image uploaded" });
      const event = await Event.findByIdAndUpdate(
        req.params.id,
        { imageUrl: `/uploads/${req.file.filename}` },
        { new: true }
      );
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json(event);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: message });
    }
  }
);

// --- USER CRUD (protected) ---
app.post("/api/users", authMiddleware, async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(400).json({ error: message });
  }
});

// User profile image upload (protected)
app.post(
  "/api/users/:id/image",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No image uploaded" });
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { imageUrl: `/uploads/${req.file.filename}` },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: message });
    }
  }
);

// Get all Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Get User by ID
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Update User
app.put("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(400).json({ error: message });
  }
});

// Delete User
app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// --- EVENT CRUD ---
// Create Event (with image upload, protected)
app.post("/api/events", upload.single("image"), async (req, res) => {
  try {
    const eventData = {
      title: req.body.title,
      description: req.body.description,
      date: new Date(req.body.date),
      location: req.body.location,
      price: parseFloat(req.body.price),
      seats: parseInt(req.body.seats),
      category: req.body.category || "Live shows",
    };

    // Validate date is in the future
    if (eventData.date <= new Date()) {
      return res
        .status(400)
        .json({ error: "Event date must be in the future" });
    }

    if (req.file) {
      eventData.imageUrl = `/uploads/${req.file.filename}`;
    }

    if (req.body.user) {
      eventData.createdBy = req.body.user;
    }

    const event = new Event(eventData);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.log("Event creation error:", message);
    res.status(400).json({ error: message });
  }
});

// Get all Events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy");
    res.json(events);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Search Events by name
app.get("/api/events/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const events = await Event.find({
      title: { $regex: query, $options: "i" }, // Case-insensitive search
    }).populate("createdBy");
    res.json(events);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Get Event by ID
app.get("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("createdBy");
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Update Event
app.put("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(400).json({ error: message });
  }
});

// Delete Event
app.delete("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json({ message: "Event deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// MongoDB connection
const dbUrl = process.env.DB_URL || process.env.DATABASE_URL;
console.log("🔍 Environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV || "not set");
console.log(
  "DB_URL environment variable:",
  process.env.DB_URL ? "Set" : "NOT SET"
);
console.log(
  "DATABASE_URL environment variable:",
  process.env.DATABASE_URL ? "Set" : "NOT SET"
);
console.log(
  "Available environment variables:",
  Object.keys(process.env).filter(
    (key) => key.includes("DB") || key.includes("DATABASE")
  )
);

if (!dbUrl) {
  console.error(
    "❌ Neither DB_URL nor DATABASE_URL environment variable is set!"
  );
  console.error(
    "🔧 For Railway deployment: Set DB_URL in Railway Variables tab"
  );
  console.error(
    "🔧 For local development: Ensure .env file exists with DB_URL"
  );
  console.error("📁 Current working directory:", process.cwd());
  console.error("📁 __dirname:", __dirname);
  process.exit(1);
}

console.log("✅ Database URL found, attempting connection...");
console.log("🔒 Connection string preview:", dbUrl.substring(0, 20) + "...");

if (!dbUrl.startsWith("mongodb://") && !dbUrl.startsWith("mongodb+srv://")) {
  console.error("❌ Invalid MongoDB connection string format!");
  console.error("Expected format: mongodb:// or mongodb+srv://");
  console.error("Received:", dbUrl);
  process.exit(1);
}

// Alternative connection approach for SSL issues
async function connectToMongoDB() {
  try {
    console.log("🔄 Attempting MongoDB connection...");

    // Try connection with modern SSL options
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
      ssl: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: false,
    };

    await mongoose.connect(dbUrl, connectionOptions);
    console.log("✅ Connected to MongoDB Atlas successfully!");
  } catch (error) {
    console.error("❌ Initial connection failed, trying fallback approach...");

    // Fallback: try with minimal SSL options
    try {
      const fallbackOptions = {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        ssl: true,
        tlsAllowInvalidCertificates: true,
      };

      await mongoose.connect(dbUrl, fallbackOptions);
      console.log("✅ Connected to MongoDB using fallback options!");
    } catch (fallbackError) {
      console.error("❌ All connection attempts failed:");
      console.error("Original error:", error.message);
      console.error("Fallback error:", fallbackError.message);

      console.error("\n🔧 Troubleshooting suggestions:");
      console.error(
        "1. Check if your IP address is whitelisted in MongoDB Atlas"
      );
      console.error("2. Verify the cluster is running and accessible");
      console.error("3. Try connecting from a different network");
      console.error(
        "4. Check if corporate firewall is blocking the connection"
      );

      process.exit(1);
    }
  }
}

// Connect to MongoDB
connectToMongoDB();

const db = mongoose.connection;

db.on("error", (error) => {
  console.error("❌ MongoDB connection error:");
  console.error(error);

  // If it's an SSL error, provide specific guidance
  if (
    (error.message && error.message.includes("SSL")) ||
    error.message.includes("TLS")
  ) {
    console.error("🔒 SSL/TLS Error Detected:");
    console.error("This might be due to:");
    console.error("1. Network connectivity issues");
    console.error("2. Firewall blocking MongoDB Atlas");
    console.error("3. Invalid SSL certificates");
    console.error("4. MongoDB Atlas cluster configuration");
    console.error("\n💡 Troubleshooting steps:");
    console.error("- Check your internet connection");
    console.error("- Verify MongoDB Atlas cluster is active");
    console.error("- Check IP whitelist in MongoDB Atlas");
    console.error("- Try using a different network connection");
  }
});

db.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
});

db.on("reconnected", () => {
  console.log("✅ MongoDB reconnected successfully");
});

db.once("open", function () {
  console.log("✅ Connected to MongoDB Atlas successfully!");
  console.log("🗄️ Database:", db.name);
  console.log("🔗 Connection state:", db.readyState);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
