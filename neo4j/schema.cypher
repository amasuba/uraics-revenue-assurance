// URAICS Neo4j Graph Database Schema
// Taxpayer and Risk Relationship Model

// Create Taxpayer nodes
CREATE CONSTRAINT taxpayer_tin_unique IF NOT EXISTS
FOR (t:Taxpayer) REQUIRE t.tin IS UNIQUE;

CREATE INDEX taxpayer_tin_index IF NOT EXISTS
FOR (t:Taxpayer) ON (t.tin);

CREATE INDEX taxpayer_region_index IF NOT EXISTS
FOR (t:Taxpayer) ON (t.region);

// Create Risk nodes
CREATE CONSTRAINT risk_id_unique IF NOT EXISTS
FOR (r:Risk) REQUIRE r.riskId IS UNIQUE;

CREATE INDEX risk_id_index IF NOT EXISTS
FOR (r:Risk) ON (r.riskId);

// Create Region nodes
CREATE INDEX region_name_index IF NOT EXISTS
FOR (r:Region) ON (r.name);

// Create relationships
// Taxpayer -> HAS_RISK -> Risk
// Taxpayer -> LOCATED_IN -> Region
// Risk -> AFFECTS -> Region

// Example: Create a taxpayer
// CREATE (t:Taxpayer {
//   tin: '1001769112',
//   name: 'Example Taxpayer',
//   region: 'Kampala',
//   status: 'REGD',
//   createdAt: datetime()
// })

// Example: Create a risk
// CREATE (r:Risk {
//   riskId: 'p',
//   name: 'Presumptive Taxpayers with High Turnover',
//   description: 'Presumptive taxpayers with gross turnover above 150 million',
//   category: 'Income Tax'
// })

// Example: Create relationship
// MATCH (t:Taxpayer {tin: '1001769112'})
// MATCH (r:Risk {riskId: 'p'})
// CREATE (t)-[rel:HAS_RISK {
//   exposure: 50000000,
//   flaggedDate: datetime(),
//   status: 'flagged'
// }]->(r)
// RETURN t, rel, r

