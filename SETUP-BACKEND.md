# Backend Integration Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Oracle Instant Client (for Oracle DB connection)
- Neo4j installed (Docker or Desktop)
- n8n installed globally

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

```bash
cp env.example .env
# Edit .env with your actual credentials
```

**Required Environment Variables:**
- `ORACLE_PASSWORD` - Your Oracle ETAXDB password
- `NEO4J_PASSWORD` - Your Neo4j password
- `N8N_API_KEY` - Your n8n API key (optional)

### Step 3: Install Oracle Instant Client

**Windows:**
1. Download Oracle Instant Client from Oracle website
2. Extract to `C:\oracle\instantclient_21_3`
3. Add to PATH: `C:\oracle\instantclient_21_3`

**Linux/Mac:**
```bash
# Using package manager or download from Oracle
```

### Step 4: Start Neo4j

**Using Docker:**
```bash
docker run -d \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your_password \
  neo4j:latest
```

**Or use Neo4j Desktop:**
- Download from https://neo4j.com/download/
- Create new database
- Set password

### Step 5: Initialize Neo4j Schema

```bash
# Connect to Neo4j
cypher-shell -u neo4j -p your_password

# Run schema script
:source neo4j/schema.cypher
```

Or use Neo4j Browser (http://localhost:7474) and paste the contents of `neo4j/schema.cypher`

### Step 6: Start n8n

```bash
npm install -g n8n
n8n start
```

Access n8n UI: http://localhost:5678

**Import Workflows:**
1. Go to Workflows → Import from File
2. Import `n8n/workflows/sync-taxpayers.json`
3. Import `n8n/workflows/sync-risk-data.json`
4. Configure credentials in n8n UI

### Step 7: Start Backend API Server

```bash
cd backend
npm start
```

API will be available at: http://localhost:3001

### Step 8: Configure Frontend

Create `.env` file in project root:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

### Step 9: Test Integration

1. **Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Get Risk Data:**
   ```bash
   curl http://localhost:3001/api/risks/p
   ```

3. **Get Dashboard KPIs:**
   ```bash
   curl http://localhost:3001/api/dashboard/kpis
   ```

## Data Flow

1. **n8n Workflows** sync data from Oracle → Neo4j hourly
2. **Backend API** queries both Oracle (for detailed data) and Neo4j (for relationships)
3. **Frontend** consumes API endpoints to display dashboards

## Next Steps

1. ✅ Backend structure created
2. ⏳ Complete SQL queries for all 19 risk types (a-s)
3. ⏳ Test Oracle connection
4. ⏳ Test Neo4j connection
5. ⏳ Run n8n workflows
6. ⏳ Verify API endpoints
7. ⏳ Test frontend integration

## Troubleshooting

**Oracle Connection:**
- Ensure Oracle Instant Client is in PATH
- Verify network access to `exd02-c1-scan:1521`
- Check credentials in `.env`

**Neo4j Connection:**
- Verify Neo4j is running: `docker ps` or check Neo4j Desktop
- Test: `cypher-shell -u neo4j -p password`

**n8n Issues:**
- Check n8n is running: http://localhost:5678
- Verify workflow credentials are configured
- Check n8n execution logs

**API Issues:**
- Check backend logs for errors
- Verify all services are running
- Test health endpoint first

