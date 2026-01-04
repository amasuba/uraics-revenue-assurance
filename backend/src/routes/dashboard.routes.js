/**
 * Dashboard API Routes
 * Handles home dashboard and KPI endpoints
 */

const express = require("express");
const router = express.Router();
const oracleService = require("../services/oracle.service");
const neo4jService = require("../services/neo4j.service");

/**
 * GET /api/dashboard/kpis
 * Get dashboard KPIs
 */
router.get("/kpis", async (req, res) => {
  try {
    const totalTaxpayers = await oracleService.getTotalTaxpayers();

    // Get risk counts from Neo4j
    const riskCounts = await neo4jService.executeQuery(`
      MATCH (r:Risk)
      OPTIONAL MATCH (t:Taxpayer)-[:HAS_RISK]->(r)
      RETURN r.riskId as riskId, count(t) as count
    `);

    const totalExposure = await neo4jService.executeQuery(`
      MATCH (t:Taxpayer)-[rel:HAS_RISK]->(r:Risk)
      RETURN sum(rel.exposure) as totalExposure
    `);

    res.json({
      totalTaxpayers,
      flaggedTaxpayers: riskCounts.reduce((sum, r) => sum + r.count, 0),
      complianceRate: 0, // Calculate based on data
      totalExposure: totalExposure[0]?.totalExposure || 0,
      risksActive: riskCounts.length,
      pendingAudits: 0, // From audit system
      completedAudits: 0,
      auditRecovery: 0,
    });
  } catch (error) {
    console.error("Dashboard KPIs error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/regional
 * Get regional distribution data
 */
router.get("/regional", async (req, res) => {
  try {
    const query = `
      MATCH (t:Taxpayer)
      OPTIONAL MATCH (t)-[rel:HAS_RISK]->(r:Risk)
      RETURN t.region as region,
             count(DISTINCT t) as totalTaxpayers,
             count(rel) as flaggedTaxpayers,
             sum(rel.exposure) as exposure
      ORDER BY exposure DESC
    `;
    const data = await neo4jService.executeQuery(query);
    res.json(data);
  } catch (error) {
    console.error("Regional data error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

