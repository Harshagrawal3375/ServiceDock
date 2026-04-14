const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

let lastDbError = "";

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is missing in environment variables");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables");
}

if (!/^mongodb(\+srv)?:\/\//.test(process.env.MONGO_URI)) {
  throw new Error("MONGO_URI must start with mongodb:// or mongodb+srv://");
}

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getDbConnectOptions = () => {
  const options = {
    serverSelectionTimeoutMS: parsePositiveNumber(
      process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
      10_000
    ),
    connectTimeoutMS: parsePositiveNumber(process.env.MONGO_CONNECT_TIMEOUT_MS, 10_000),
    socketTimeoutMS: parsePositiveNumber(process.env.MONGO_SOCKET_TIMEOUT_MS, 20_000),
  };

  // Atlas + Windows environments can get stuck resolving IPv6 routes.
  if (process.env.MONGO_FORCE_IPV4 !== "false") {
    options.family = 4;
  }

  return options;
};

const formatDbError = (err) => {
  if (!err) {
    return "Unknown database error";
  }

  if (typeof err === "string") {
    return err;
  }

  const messages = [];
  const pushIfPresent = (value) => {
    if (typeof value === "string" && value.trim() && !messages.includes(value.trim())) {
      messages.push(value.trim());
    }
  };

  pushIfPresent(err.message);
  pushIfPresent(err.reason && err.reason.message);
  pushIfPresent(err.cause && err.cause.message);

  const errorMessage = messages.join(" | ") || "Unknown database error";

  if (/whitelist|network access list|not whitelisted/i.test(errorMessage)) {
    return `${errorMessage} Add your current IP in Atlas Network Access (or temporarily allow 0.0.0.0/0).`;
  }

  return errorMessage;
};

const getDbStatus = () => {
  switch (mongoose.connection.readyState) {
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "disconnected";
  }
};

const ensureDbConnected = (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    message: "Database is not connected yet. Check MONGO_URI and Atlas network access.",
    dbStatus: getDbStatus(),
    lastDbError,
  });
};

app.get("/", (req,res)=>{
  res.send("Student Helper API Running");
});

app.get("/api/health", (req, res) => {
  res.json({
    api: "ok",
    dbStatus: getDbStatus(),
    lastDbError,
  });
});

app.use("/api", ensureDbConnected);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/transactions", require("./routes/transaction"));
app.use("/api/admin", require("./routes/admin"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});

const PORT = Number(process.env.PORT) || 5000;

mongoose.connection.on("connected", () => {
  lastDbError = "";
  console.log("DB Connected");
});

mongoose.connection.on("error", (err) => {
  const formattedError = formatDbError(err);

  if (!lastDbError || formattedError.length > lastDbError.length) {
    lastDbError = formattedError;
  }

  console.error("MongoDB connection error:", formattedError);
});

mongoose.connection.on("disconnected", () => {
  if (!lastDbError) {
    lastDbError = "Database disconnected";
  }
  console.warn("MongoDB disconnected");
});

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, getDbConnectOptions());
    lastDbError = "";
  } catch (err) {
    lastDbError = formatDbError(err);
    console.error("Database connection failed:", lastDbError);
    console.error("Retrying DB connection in 10 seconds...");
    setTimeout(connectToDatabase, 10_000);
  }
};

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
connectToDatabase();
