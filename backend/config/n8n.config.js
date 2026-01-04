/**
 * n8n Workflow Automation Configuration
 * Used for orchestrating data sync between Oracle, Neo4j, and APIs
 */

module.exports = {
  baseUrl: process.env.N8N_BASE_URL || "http://localhost:5678",
  apiKey: process.env.N8N_API_KEY || "",
  webhookUrl: process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook",
  // Workflow execution settings
  executionTimeout: 300000, // 5 minutes
  retryOnFailure: true,
  maxRetries: 3,
  // Data sync intervals (in milliseconds)
  syncIntervals: {
    taxpayers: 3600000, // 1 hour
    returns: 1800000, // 30 minutes
    payments: 900000, // 15 minutes
    riskData: 3600000, // 1 hour
  },
};

