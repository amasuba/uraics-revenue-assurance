/**
 * Oracle ETAXDB Connection Configuration
 * Read-only connection to production database
 */

module.exports = {
  user: process.env.ORACLE_USER || "op$audit",
  password: process.env.ORACLE_PASSWORD || "casemonitor2",
  connectString: process.env.ORACLE_DSN || "exd02-c1-scan:1521/ETAXDB",
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60,
  // Read-only mode
  readonly: true,
  // Connection retry settings
  retryCount: 3,
  retryDelay: 1000,
};

