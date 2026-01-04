# URAICS Backend Integration

This backend integrates:
- **Oracle ETAXDB** (read-only) - Source of truth for tax data
- **Neo4j** - Graph database for relationship analysis
- **n8n** - Workflow automation for data synchronization
- **API Server** - REST API for frontend consumption

## Architecture

```
Oracle ETAXDB (Read-Only)
    ↓
n8n Workflows (Data Sync & Transformation)
    ↓
Neo4j Graph Database (Relationships & Analytics)
    ↓
API Server (Express/FastAPI)
    ↓
React Frontend
```

## Setup Instructions

### 1. Oracle ETAXDB Connection
- Connection details in `config/oracle.config.js`
- Read-only user: `op$audit`
- DSN: `exd02-c1-scan:1521/ETAXDB`

### 2. Neo4j Setup
- Install Neo4j Desktop or Docker
- Default: `bolt://localhost:7687`
- Credentials in `config/neo4j.config.js`

### 3. n8n Setup
- Install n8n: `npm install -g n8n`
- Import workflows from `n8n/workflows/`
- Configure credentials in n8n UI

### 4. API Server
- Node.js: `cd backend && npm install && npm start`
- Python: `cd backend && pip install -r requirements.txt && python app.py`

## Key Tables from ETAXDB

- `REG_TAX_PAYER_MST` - Taxpayer master data
- `RTN_RETURNS_REGISTER` - Tax returns
- `RTN_PRSMPTV_BSNS_DTL` - Presumptive tax details
- `PMT_PAYMENT_HDR` - Payment headers
- `PMT_PAYMENT_DTLS` - Payment details
- And 1000+ other tables for comprehensive analysis

