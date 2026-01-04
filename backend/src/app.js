/**
 * URAICS Backend API Server
 * Express server for frontend API consumption
 */

const express = require("express");
const cors = require("cors");
const oracleService = require("./services/oracle.service");
const neo4jService = require("./services/neo4j.service");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/risks", require("./routes/risk.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));

// Health check
app.get("/health", async (req, res) => {
  try {
    const oracleHealth = await oracleService.getTotalTaxpayers();
    const neo4jHealth = await neo4jService.executeQuery("RETURN 1 as health");
    res.json({
      status: "healthy",
      oracle: oracleHealth > 0 ? "connected" : "disconnected",
      neo4j: neo4jHealth.length > 0 ? "connected" : "disconnected",
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Initialize services
async function startServer() {
  try {
    await oracleService.initialize();
    await neo4jService.initialize();
    app.listen(PORT, () => {
      console.log(`URAICS API Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await oracleService.close();
  await neo4jService.close();
  process.exit(0);
});

startServer();

module.exports = app;

