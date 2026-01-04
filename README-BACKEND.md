# URAICS Backend Integration Guide

## Overview

The URAICS backend integrates three key systems:
1. **Oracle ETAXDB** - Read-only production database
2. **Neo4j** - Graph database for relationship analysis
3. **n8n** - Workflow automation for data synchronization

## Architecture

```
┌─────────────────┐
│  Oracle ETAXDB │ (Read-only source)
│   (Production)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   n8n Workflows  │ (Data sync & transformation)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Neo4j Graph   │ (Relationships & analytics)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Server    │ (Express/Node.js)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ React Frontend  │
└─────────────────┘
```

## Setup Instructions

### 1. Oracle ETAXDB Connection

**Connection Details:**
- User: `op$audit`
- Password: Set in environment variable
- DSN: `exd02-c1-scan:1521/ETAXDB`
- Mode: Read-only

**Key Tables:**
- `REG_TAX_PAYER_MST` - Taxpayer master (Total taxpayers count)
- `RTN_RETURNS_REGISTER` - Tax returns
- `RTN_PRSMPTV_BSNS_DTL` - Presumptive tax details (Risk P)
- `PMT_PAYMENT_HDR` / `PMT_PAYMENT_DTLS` - Payments
- 1000+ other tables for comprehensive analysis

### 2. Neo4j Setup

**Installation:**
```bash
# Using Docker
docker run -d \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest

# Or download Neo4j Desktop from https://neo4j.com/download/
```

**Schema:**
- Nodes: `Taxpayer`, `Risk`, `Region`
- Relationships: `HAS_RISK`, `LOCATED_IN`
- See `neo4j/schema.cypher` for full schema

### 3. n8n Setup

**Installation:**
```bash
npm install -g n8n
n8n start
```

**Workflows:**
- `sync-taxpayers.json` - Syncs taxpayers from Oracle to Neo4j
- `sync-risk-data.json` - Syncs risk data hourly

**Import Workflows:**
1. Open n8n UI: http://localhost:5678
2. Go to Workflows → Import from File
3. Import workflows from `n8n/workflows/`

### 4. Backend API Server

**Installation:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

**API Endpoints:**
- `GET /api/risks/:id` - Get risk dashboard data
- `GET /api/risks/:id/summary` - Get risk summary
- `GET /api/risks/:id/taxpayers` - Get flagged taxpayers
- `GET /api/dashboard/kpis` - Get dashboard KPIs
- `GET /api/dashboard/regional` - Get regional distribution
- `GET /health` - Health check

### 5. Frontend Integration

The frontend uses the API service in `src/services/api.service.ts`.

**Environment Variables:**
Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

## Risk Types Implementation

Each risk type (a-s) will have:
1. **Oracle SQL Query** - In `backend/src/services/oracle.service.js`
2. **Neo4j Relationships** - Created via n8n workflows
3. **API Endpoint** - `/api/risks/:id`
4. **Frontend Dashboard** - Already implemented in `RiskDashboard.tsx`

## Next Steps

1. ✅ Backend structure created
2. ⏳ Implement SQL queries for all 19 risk types
3. ⏳ Set up n8n workflows for each risk type
4. ⏳ Create Neo4j relationships for risk analysis
5. ⏳ Connect frontend to backend APIs
6. ⏳ Test end-to-end data flow

## Development

**Backend:**
```bash
cd backend
npm run dev  # With nodemon for auto-reload
```

**Frontend:**
```bash
npm run dev
```

**n8n:**
```bash
n8n start
```

## Troubleshooting

**Oracle Connection Issues:**
- Verify network access to `exd02-c1-scan:1521`
- Check credentials in `.env`
- Ensure Oracle Instant Client is installed

**Neo4j Connection Issues:**
- Verify Neo4j is running: `docker ps`
- Check credentials in `.env`
- Test connection: `cypher-shell -u neo4j -p password`

**n8n Issues:**
- Check n8n logs: `n8n logs`
- Verify workflow credentials are set
- Test individual nodes in n8n UI

