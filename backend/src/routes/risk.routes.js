/**
 * Risk Dashboard API Routes
 * Handles all risk-related endpoints
 */

const express = require("express");
const router = express.Router();
const oracleService = require("../services/oracle.service");
const neo4jService = require("../services/neo4j.service");

/**
 * GET /api/risks/:id
 * Get risk dashboard data for a specific risk type
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, region, limit = 100 } = req.query;

    // Get data from Oracle
    const oracleData = await oracleService.getRiskData(id, {
      startDate: startDate || "01/07/2023",
      endDate: endDate || "31/01/2024",
      region,
    });

    // Get graph relationships from Neo4j
    const graphData = await neo4jService.getTaxpayersByRisk(id, limit);

    res.json({
      riskId: id,
      summary: {
        totalTaxpayers: oracleData.length,
        flaggedCount: oracleData.filter((d) => d.flagged).length,
        totalExposure: oracleData.reduce((sum, d) => sum + (d.exposure || 0), 0),
      },
      data: oracleData,
      relationships: graphData,
    });
  } catch (error) {
    console.error("Risk data error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/risks/:id/summary
 * Get summary statistics for a risk type
 */
router.get("/:id/summary", async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const data = await oracleService.getRiskData(id, {
      startDate: startDate || "01/07/2023",
      endDate: endDate || "31/01/2024",
    });

    const summary = {
      totalTaxpayers: data.length,
      flaggedCount: data.filter((d) => d.flagged).length,
      totalExposure: data.reduce((sum, d) => sum + (d.exposure || 0), 0),
      avgExposure: 0,
      complianceRate: 0,
    };

    summary.avgExposure =
      summary.flaggedCount > 0
        ? summary.totalExposure / summary.flaggedCount
        : 0;
    summary.complianceRate =
      summary.totalTaxpayers > 0
        ? ((summary.totalTaxpayers - summary.flaggedCount) /
            summary.totalTaxpayers) *
          100
        : 0;

    res.json(summary);
  } catch (error) {
    console.error("Risk summary error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/risks/:id/taxpayers
 * Get flagged taxpayers for a risk type
 */
router.get("/:id/taxpayers", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const taxpayers = await neo4jService.getTaxpayersByRisk(
      id,
      parseInt(limit)
    );

    res.json({
      riskId: id,
      taxpayers: taxpayers.slice(parseInt(offset)),
      total: taxpayers.length,
    });
  } catch (error) {
    console.error("Taxpayers error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

