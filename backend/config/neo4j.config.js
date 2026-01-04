/**
 * Neo4j Graph Database Configuration
 * Used for storing relationships and graph analytics
 */

module.exports = {
  uri: process.env.NEO4J_URI || "bolt://localhost:7687",
  user: process.env.NEO4J_USER || "neo4j",
  password: process.env.NEO4J_PASSWORD || "password",
  database: process.env.NEO4J_DATABASE || "uraics",
  // Connection pool settings
  maxConnectionPoolSize: 50,
  connectionAcquisitionTimeout: 60000,
  // Encryption
  encrypted: process.env.NEO4J_ENCRYPTED === "true" || false,
};

