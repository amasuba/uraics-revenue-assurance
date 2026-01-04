/**
 * Neo4j Graph Database Service
 * Handles graph operations for relationship analysis
 */

const neo4j = require("neo4j-driver");
const config = require("../config/neo4j.config");

class Neo4jService {
  constructor() {
    this.driver = null;
  }

  async initialize() {
    try {
      this.driver = neo4j.driver(
        config.uri,
        neo4j.auth.basic(config.user, config.password)
      );
      await this.driver.verifyConnectivity();
      console.log("Neo4j connection established");
      await this.createIndexes();
    } catch (error) {
      console.error("Neo4j connection failed:", error);
      throw error;
    }
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
      console.log("Neo4j connection closed");
    }
  }

  async createIndexes() {
    const session = this.driver.session();
    try {
      // Create indexes for better performance
      await session.run(`
        CREATE INDEX taxpayer_tin_index IF NOT EXISTS
        FOR (t:Taxpayer) ON (t.tin)
      `);
      await session.run(`
        CREATE INDEX risk_id_index IF NOT EXISTS
        FOR (r:Risk) ON (r.riskId)
      `);
      console.log("Neo4j indexes created");
    } catch (error) {
      console.error("Index creation error (may already exist):", error.message);
    } finally {
      await session.close();
    }
  }

  async executeQuery(query, params = {}) {
    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map((record) => record.toObject());
    } catch (error) {
      console.error("Neo4j query error:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create or update taxpayer node
   */
  async upsertTaxpayer(taxpayerData) {
    const query = `
      MERGE (t:Taxpayer {tin: $tin})
      SET t.name = $name,
          t.region = $region,
          t.status = $status,
          t.updatedAt = datetime()
      RETURN t
    `;
    return await this.executeQuery(query, taxpayerData);
  }

  /**
   * Create risk relationship
   */
  async createRiskRelationship(tin, riskId, riskData) {
    const query = `
      MATCH (t:Taxpayer {tin: $tin})
      MERGE (r:Risk {riskId: $riskId})
      MERGE (t)-[rel:HAS_RISK {
        exposure: $exposure,
        flaggedDate: datetime(),
        status: $status
      }]->(r)
      RETURN t, rel, r
    `;
    return await this.executeQuery(query, {
      tin,
      riskId,
      ...riskData,
    });
  }

  /**
   * Get taxpayers by risk type
   */
  async getTaxpayersByRisk(riskId, limit = 100) {
    const query = `
      MATCH (t:Taxpayer)-[rel:HAS_RISK]->(r:Risk {riskId: $riskId})
      RETURN t, rel, r
      ORDER BY rel.exposure DESC
      LIMIT $limit
    `;
    return await this.executeQuery(query, { riskId, limit });
  }

  /**
   * Get risk network graph
   */
  async getRiskNetwork(tin) {
    const query = `
      MATCH (t:Taxpayer {tin: $tin})-[rel:HAS_RISK]->(r:Risk)
      RETURN t, rel, r
      ORDER BY rel.exposure DESC
    `;
    return await this.executeQuery(query, { tin });
  }
}

module.exports = new Neo4jService();

