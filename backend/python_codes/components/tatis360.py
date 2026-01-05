# TATIS360 - Tax Audit Intelligent Search (Chatbot Dashboard)
## Conversational AI interface with Neo4j graph traversal

```python
# ═══════════════════════════════════════════════════════════════════════
# TATIS360 - CONVERSATIONAL TAX AUDIT INTELLIGENCE SYSTEM
# Neo4j-powered chatbot for intelligent risk investigation
# ═══════════════════════════════════════════════════════════════════════

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from py2neo import Graph
from datetime import datetime
import logging
from typing import List, Dict, Tuple
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════
# PAGE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════

st.set_page_config(
    page_title="TATIS360 - Tax Audit Intelligence",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# URA Brand Colors
URA_COLORS = {
    'primary': '#1B5E20',
    'secondary': '#388E3C',
    'accent': '#FFC107',
    'critical': '#D32F2F',
    'warning': '#F57C00',
    'info': '#1976D2',
    'success': '#388E3C',
}

# ═══════════════════════════════════════════════════════════════════════
# NEO4J CONNECTION
# ═══════════════════════════════════════════════════════════════════════

@st.cache_resource
def get_neo4j_connection():
    """Create and cache Neo4j connection"""
    try:
        graph = Graph(
            uri="bolt://localhost:7687",
            user="neo4j",
            password=st.secrets.get("NEO4J_PASSWORD", "default")
        )
        graph.run("RETURN 1")
        return graph
    except Exception as e:
        logger.error(f"Neo4j connection failed: {e}")
        st.error(f"❌ Neo4j connection failed: {e}")
        return None

# ═══════════════════════════════════════════════════════════════════════
# CYPHER QUERY FUNCTIONS - GRAPH TRAVERSAL
# ═══════════════════════════════════════════════════════════════════════

def search_taxpayer_by_tin(graph, tin: str) -> Dict:
    """
    Search taxpayer by TIN
    Graph traversal: TIN → Taxpayer → All relationships
    Performance: <50ms
    """
    try:
        query = """
        MATCH (t:Taxpayer {TIN: $tin})
        OPTIONAL MATCH (t)-[flagged:FLAGGED_BY]->(rf:RiskFlag)
        OPTIONAL MATCH (t)-[filed:FILED]->(ir:ITReturn)
        OPTIONAL MATCH (t)-[reported:REPORTED]->(er:EFRISReturn)
        
        RETURN {
          taxpayer: {
            tin: t.TIN,
            name: t.TaxpayerName,
            region: t.Region,
            sector: t.Sector,
            status: t.ComplianceStatus,
            createdDate: t.CreatedDate
          },
          risks: collect(DISTINCT {
            riskId: rf.RiskID,
            riskName: rf.RiskName,
            severity: rf.Severity,
            exposureAmount: flagged.ExposureAmount,
            detectedDate: flagged.DetectedDate
          }),
          itReturns: collect(DISTINCT {
            returnId: ir.ReturnID,
            year: ir.TaxYear,
            filedDate: ir.FiledDate,
            totalIncome: ir.TotalIncome
          }),
          efrisReturns: collect(DISTINCT {
            returnId: er.ReturnID,
            period: er.Period,
            totalSales: er.TotalSales,
            vat: er.VATAmount
          })
        } AS result
        """
        
        result = graph.run(query, tin=tin).data()
        return result[0]['result'] if result else None
        
    except Exception as e:
        logger.error(f"Taxpayer search failed: {e}")
        return None

def search_taxpayer_by_name(graph, name: str) -> List[Dict]:
    """
    Search taxpayer by name (fuzzy match)
    Graph traversal: Name pattern → Taxpayers
    Performance: <100ms
    """
    try:
        query = """
        MATCH (t:Taxpayer)
        WHERE toLower(t.TaxpayerName) CONTAINS toLower($name)
        OPTIONAL MATCH (t)-[flagged:FLAGGED_BY]->(rf:RiskFlag)
        
        RETURN {
          tin: t.TIN,
          name: t.TaxpayerName,
          region: t.Region,
          sector: t.Sector,
          status: t.ComplianceStatus,
          riskCount: COUNT(DISTINCT rf),
          totalExposure: SUM(flagged.ExposureAmount)
        } AS taxpayer
        
        ORDER BY totalExposure DESC
        LIMIT 10
        """
        
        result = graph.run(query, name=name).data()
        return [r['taxpayer'] for r in result] if result else []
        
    except Exception as e:
        logger.error(f"Taxpayer name search failed: {e}")
        return []

def find_related_taxpayers(graph, tin: str) -> List[Dict]:
    """
    Find taxpayers with similar risk profiles
    Graph traversal: Taxpayer → RiskFlags → Similar Taxpayers
    Performance: <200ms
    """
    try:
        query = """
        MATCH (t:Taxpayer {TIN: $tin})-[flagged:FLAGGED_BY]->(rf:RiskFlag)
        MATCH (rf)<-[related:FLAGGED_BY]-(t2:Taxpayer)
        WHERE t2.TIN <> $tin
        
        WITH t2,
             COUNT(DISTINCT rf) AS shared_risk_count,
             SUM(related.ExposureAmount) AS avg_exposure
        
        RETURN {
          tin: t2.TIN,
          name: t2.TaxpayerName,
          region: t2.Region,
          sector: t2.Sector,
          sharedRisks: shared_risk_count,
          similarityScore: ROUND(100.0 * shared_risk_count / 18, 1),
          exposure: ROUND(avg_exposure, 0)
        } AS related
        
        ORDER BY shared_risk_count DESC
        LIMIT 10
        """
        
        result = graph.run(query, tin=tin).data()
        return [r['related'] for r in result] if result else []
        
    except Exception as e:
        logger.error(f"Related taxpayer search failed: {e}")
        return []

def get_risk_pathway(graph, tin: str, risk_id: str) -> Dict:
    """
    Get evidence pathway for a specific risk
    Graph traversal: Taxpayer → RiskFlag → Evidence nodes
    Performance: <150ms
    """
    try:
        query = """
        MATCH (t:Taxpayer {TIN: $tin})-[flagged:FLAGGED_BY]->(rf:RiskFlag {RiskID: $risk_id})
        
        OPTIONAL MATCH (t)-[filed:FILED]->(ir:ITReturn)
        OPTIONAL MATCH (t)-[reported:REPORTED]->(er:EFRISReturn)
        
        WITH rf, flagged, ir, er
        OPTIONAL MATCH (ir)-[discrepancy]->(er)
        
        RETURN {
          risk: {
            riskId: rf.RiskID,
            riskName: rf.RiskName,
            description: rf.Description,
            severity: rf.Severity,
            exposureAmount: flagged.ExposureAmount,
            detectedDate: flagged.DetectedDate,
            evidence: flagged.EvidenceDetails
          },
          itReturn: {
            returnId: ir.ReturnID,
            year: ir.TaxYear,
            totalIncome: ir.TotalIncome,
            filedDate: ir.FiledDate
          },
          efrisReturn: {
            returnId: er.ReturnID,
            period: er.Period,
            totalSales: er.TotalSales,
            vat: er.VATAmount
          },
          variance: {
            description: discrepancy,
            amount: ABS(ir.TotalIncome - er.TotalSales)
          }
        } AS pathway
        """
        
        result = graph.run(query, tin=tin, risk_id=risk_id).data()
        return result[0]['pathway'] if result else None
        
    except Exception as e:
        logger.error(f"Risk pathway retrieval failed: {e}")
        return None

def find_high_impact_cases(graph, risk_id: str = None, min_exposure: float = 1e9) -> List[Dict]:
    """
    Find high-impact audit cases
    Graph traversal: Risk → Taxpayers with high exposure
    Performance: <200ms
    """
    try:
        if risk_id:
            query = """
            MATCH (t:Taxpayer)-[flagged:FLAGGED_BY]->(rf:RiskFlag {RiskID: $risk_id})
            WHERE flagged.ExposureAmount >= $min_exposure
            
            RETURN {
              tin: t.TIN,
              name: t.TaxpayerName,
              region: t.Region,
              sector: t.Sector,
              riskId: rf.RiskID,
              riskName: rf.RiskName,
              exposure: flagged.ExposureAmount,
              detectedDate: flagged.DetectedDate
            } AS case
            
            ORDER BY exposure DESC
            LIMIT 20
            """
            result = graph.run(query, risk_id=risk_id, min_exposure=min_exposure).data()
        else:
            query = """
            MATCH (t:Taxpayer)-[flagged:FLAGGED_BY]->(rf:RiskFlag)
            WHERE flagged.ExposureAmount >= $min_exposure
            
            RETURN {
              tin: t.TIN,
              name: t.TaxpayerName,
              region: t.Region,
              sector: t.Sector,
              riskCount: COUNT(DISTINCT rf),
              totalExposure: SUM(flagged.ExposureAmount)
            } AS case
            
            ORDER BY totalExposure DESC
            LIMIT 20
            """
            result = graph.run(query, min_exposure=min_exposure).data()
        
        return [r['case'] for r in result] if result else []
        
    except Exception as e:
        logger.error(f"High impact case search failed: {e}")
        return []

def trace_relationship_path(graph, start_tin: str, end_tin: str) -> List[Dict]:
    """
    Find connection path between two taxpayers
    Graph traversal: Start Taxpayer → Common Risk Flags → End Taxpayer
    Performance: <250ms
    """
    try:
        query = """
        MATCH path = shortestPath(
            (t1:Taxpayer {TIN: $start_tin})-[:FLAGGED_BY*1..3]-(t2:Taxpayer {TIN: $end_tin})
        )
        
        WITH path,
             [node IN nodes(path) WHERE node:RiskFlag] AS risks,
             [node IN nodes(path) WHERE node:Taxpayer] AS taxpayers
        
        RETURN {
          pathLength: length(path),
          taxpayers: [t IN taxpayers | {
            tin: t.TIN,
            name: t.TaxpayerName,
            region: t.Region
          }],
          commonRisks: [r IN risks | {
            riskId: r.RiskID,
            riskName: r.RiskName,
            severity: r.Severity
          }]
        } AS connectionPath
        
        LIMIT 1
        """
        
        result = graph.run(query, start_tin=start_tin, end_tin=end_tin).data()
        return result[0]['connectionPath'] if result else None
        
    except Exception as e:
        logger.error(f"Path tracing failed: {e}")
        return None

def get_sector_risk_profile(graph, sector: str) -> Dict:
    """
    Get risk profile for entire sector
    Graph traversal: Sector → Taxpayers → Risks
    Performance: <200ms
    """
    try:
        query = """
        MATCH (t:Taxpayer {Sector: $sector})-[flagged:FLAGGED_BY]->(rf:RiskFlag)
        
        WITH rf,
             COUNT(DISTINCT t) AS sector_taxpayers_flagged,
             SUM(flagged.ExposureAmount) AS sector_exposure,
             AVG(flagged.ExposureAmount) AS avg_exposure
        
        RETURN {
          sector: $sector,
          riskId: rf.RiskID,
          riskName: rf.RiskName,
          severity: rf.Severity,
          prevalence: sector_taxpayers_flagged,
          totalExposure: sector_exposure,
          averageExposure: ROUND(avg_exposure, 0)
        } AS riskProfile
        
        ORDER BY sector_exposure DESC
        """
        
        result = graph.run(query, sector=sector).data()
        return [r['riskProfile'] for r in result] if result else []
        
    except Exception as e:
        logger.error(f"Sector profile failed: {e}")
        return []

# ═══════════════════════════════════════════════════════════════════════
# CHATBOT INTENT DETECTION & RESPONSE
# ═══════════════════════════════════════════════════════════════════════

def detect_intent(user_input: str) -> Tuple[str, Dict]:
    """
    Detect user intent from natural language
    Returns: (intent, extracted_params)
    """
    user_input = user_input.lower().strip()
    
    # Intent patterns
    intents = {
        'search_tin': {
            'patterns': [r'search (\w+)', r'find (\w+)', r'tin (\w+)', r'taxpayer (\w+)'],
            'keywords': ['tin', 'search', 'find', 'taxpayer']
        },
        'search_name': {
            'patterns': [r'search .* (?:taxpayer|company) (.+)', r'find .* (.+)'],
            'keywords': ['name', 'company', 'business']
        },
        'risk_analysis': {
            'patterns': [r'risk.*(\w+)', r'analyze risk'],
            'keywords': ['risk', 'flagged', 'exposure', 'profile']
        },
        'related': {
            'patterns': [r'similar.*(\w+)', r'related.*(\w+)', r'network.*(\w+)'],
            'keywords': ['similar', 'related', 'network', 'connected']
        },
        'pathway': {
            'patterns': [r'evidence.*(\w+)', r'pathway.*(\w+)'],
            'keywords': ['evidence', 'pathway', 'details']
        },
        'sector_analysis': {
            'patterns': [r'sector (\w+)', r'industry (\w+)'],
            'keywords': ['sector', 'industry', 'agriculture', 'manufacturing', 'services']
        },
        'high_impact': {
            'patterns': [r'high.*impact', r'top.*cases', r'priority'],
            'keywords': ['high', 'impact', 'priority', 'urgent']
        }
    }
    
    # Try to match patterns
    for intent, config in intents.items():
        for pattern in config['patterns']:
            match = re.search(pattern, user_input)
            if match:
                params = {'extracted_value': match.group(1) if match.groups() else None}
                return intent, params
        
        # Check keyword matching as fallback
        if any(keyword in user_input for keyword in config['keywords']):
            return intent, {}
    
    return 'help', {}

def generate_response(graph, intent: str, params: Dict, user_input: str) -> Tuple[str, Dict]:
    """
    Generate chatbot response based on intent
    Returns: (response_text, data_for_visualization)
    """
    
    if intent == 'search_tin':
        tin = params.get('extracted_value')
        if tin:
            result = search_taxpayer_by_tin(graph, tin)
            if result:
                risk_count = len([r for r in result.get('risks', []) if r])
                exposure = sum([r.get('exposureAmount', 0) for r in result.get('risks', []) if r])
                
                response = f"""
                ✅ **Found Taxpayer**
                
                **Name:** {result['taxpayer']['name']}
                **TIN:** {result['taxpayer']['tin']}
                **Region:** {result['taxpayer']['region']}
                **Sector:** {result['taxpayer']['sector']}
                **Status:** {result['taxpayer']['status']}
                
                **Risk Profile:**
                - **Flagged Risks:** {risk_count}/18
                - **Total Exposure:** UGX {exposure/1e9:.1f}B
                - **IT Returns Filed:** {len([r for r in result.get('itReturns', []) if r])}
                - **EFRIS Returns:** {len([r for r in result.get('efrisReturns', []) if r])}
                
                **Recommended Action:** {
                    'CRITICAL - Immediate Audit' if risk_count >= 10 else
                    'HIGH PRIORITY - Schedule Audit' if risk_count >= 5 else
                    'MEDIUM - Review Risk Profile' if risk_count >= 2 else
                    'LOW - Routine Monitoring'
                }
                """
                return response, {'type': 'taxpayer', 'data': result}
            else:
                return f"❌ Taxpayer with TIN {tin} not found", {}
        else:
            return "❓ Please provide a TIN number to search", {}
    
    elif intent == 'search_name':
        name = params.get('extracted_value', '')
        results = search_taxpayer_by_name(graph, name)
        if results:
            df = pd.DataFrame(results)
            response = f"✅ Found {len(results)} taxpayers matching '{name}'"
            return response, {'type': 'search_results', 'data': df}
        else:
            return f"❌ No taxpayers found with name containing '{name}'", {}
    
    elif intent == 'related':
        tin = params.get('extracted_value')
        if tin:
            related = find_related_taxpayers(graph, tin)
            if related:
                response = f"✅ Found {len(related)} taxpayers with similar risk profiles to {tin}"
                return response, {'type': 'related', 'data': related}
            else:
                return f"❌ No related taxpayers found", {}
        else:
            return "❓ Please provide a TIN to find related taxpayers", {}
    
    elif intent == 'pathway':
        tin = params.get('extracted_value')
        if tin:
            # Get first risk and show pathway
            taxpayer = search_taxpayer_by_tin(graph, tin)
            if taxpayer and taxpayer.get('risks'):
                risk_id = taxpayer['risks'][0]['riskId']
                pathway = get_risk_pathway(graph, tin, risk_id)
                if pathway:
                    response = f"✅ **Evidence Pathway for {taxpayer['taxpayer']['name']} - Risk {risk_id}**\n\n"
                    response += f"**Risk:** {pathway['risk']['riskName']}\n"
                    response += f"**Exposure:** UGX {pathway['risk']['exposureAmount']/1e9:.1f}B\n"
                    response += f"**Detected:** {pathway['risk']['detectedDate']}\n"
                    return response, {'type': 'pathway', 'data': pathway}
            return "❌ No evidence pathway found", {}
        else:
            return "❓ Please provide a TIN", {}
    
    elif intent == 'high_impact':
        cases = find_high_impact_cases(graph)
        if cases:
            response = f"✅ Found {len(cases)} high-impact audit cases (Exposure > UGX 1B)"
            return response, {'type': 'cases', 'data': cases}
        else:
            return "❌ No high-impact cases found", {}
    
    elif intent == 'sector_analysis':
        sector = params.get('extracted_value', 'Manufacturing')
        profile = get_sector_risk_profile(graph, sector)
        if profile:
            response = f"✅ **Risk Profile for {sector} Sector**\n\n"
            response += f"Found {len(profile)} risk types active in this sector"
            return response, {'type': 'sector', 'data': profile}
        else:
            return f"❌ No data available for {sector} sector", {}
    
    else:  # help
        response = """
        🤖 **TATIS360 - Tax Audit Intelligence System**
        
        I can help you with:
        
        **Search & Investigation:**
        - "Search TIN 1234567890" - Find taxpayer by TIN
        - "Find taxpayer XYZ Company" - Search by name
        - "Similar to TIN 1234567890" - Find related taxpayers
        
        **Risk Analysis:**
        - "Risk analysis for TIN 1234567890" - Full risk profile
        - "Evidence pathway 1234567890" - Show risk details
        
        **Sector Analysis:**
        - "Sector Manufacturing" - Risk profile by sector
        - "High impact cases" - Priority audit cases
        
        **Examples:**
        - "Search 1234567890"
        - "Find Uganda Breweries"
        - "Similar 1234567890"
        - "High impact cases"
        """
        return response, {}

# ═══════════════════════════════════════════════════════════════════════
# VISUALIZATION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════

def visualize_taxpayer_profile(data: Dict):
    """Visualize taxpayer risk profile"""
    if not data or not data.get('risks'):
        st.info("No risk flags for this taxpayer")
        return
    
    risks = [r for r in data['risks'] if r]
    if not risks:
        return
    
    df = pd.DataFrame(risks)
    
    fig = go.Figure(
        data=[
            go.Bar(
                x=df['riskId'],
                y=df['exposureAmount'] / 1e9,
                marker_color=df['severity'].map({
                    'Critical': '#D32F2F',
                    'High': '#F57C00',
                    'Medium': '#FFC107',
                    'Low': '#1976D2'
                }),
                text=df['exposureAmount'] / 1e9,
                textposition='auto',
                hovertemplate='<b>Risk %{x}</b><br>Exposure: UGX %{y:.1f}B<extra></extra>'
            )
        ]
    )
    
    fig.update_layout(
        title="Risk Profile - Exposure by Risk Type",
        xaxis_title="Risk ID",
        yaxis_title="Exposure (UGX Billions)",
        height=400
    )
    
    st.plotly_chart(fig, use_container_width=True)

def visualize_related_taxpayers(data: List[Dict]):
    """Visualize similarity network"""
    if not data:
        st.info("No related taxpayers found")
        return
    
    df = pd.DataFrame(data)
    
    fig = go.Figure(
        data=[
            go.Scatter(
                x=df['name'],
                y=df['similarityScore'],
                mode='markers',
                marker=dict(
                    size=df['exposure'] / 1e7,
                    color=df['sharedRisks'],
                    colorscale='RdYlGn_r',
                    showscale=True,
                    colorbar=dict(title="Shared Risks")
                ),
                text=df['name'],
                hovertemplate='<b>%{text}</b><br>Similarity: %{y:.1f}%<extra></extra>'
            )
        ]
    )
    
    fig.update_layout(
        title="Similar Taxpayers - Risk Network",
        xaxis_title="Taxpayer",
        yaxis_title="Similarity Score (%)",
        height=400,
        showlegend=False
    )
    
    st.plotly_chart(fig, use_container_width=True)

def visualize_sector_profile(data: List[Dict]):
    """Visualize sector risk distribution"""
    if not data:
        return
    
    df = pd.DataFrame(data)
    
    fig = px.bar(
        df,
        x='riskId',
        y='totalExposure',
        color='severity',
        hover_name='riskName',
        color_discrete_map={
            'Critical': '#D32F2F',
            'High': '#F57C00',
            'Medium': '#FFC107',
            'Low': '#1976D2'
        },
        title="Sector Risk Profile"
    )
    
    fig.update_layout(height=400)
    st.plotly_chart(fig, use_container_width=True)

# ═══════════════════════════════════════════════════════════════════════
# MAIN APPLICATION
# ═══════════════════════════════════════════════════════════════════════

def main():
    st.title("🤖 TATIS360 - Tax Audit Intelligence System")
    st.markdown("""
    Conversational AI-powered investigation tool
    
    Ask questions about taxpayer risks, network analysis, and audit priorities
    """)
    
    st.divider()
    
    # Connect to Neo4j
    graph = get_neo4j_connection()
    if graph is None:
        return
    
    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    # Display chat history
    st.subheader("💬 Conversation")
    
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # User input
    user_input = st.chat_input("Ask me about taxpayer risks, investigations, or audit priorities...")
    
    if user_input:
        # Add user message
        st.session_state.messages.append({
            "role": "user",
            "content": user_input
        })
        
        # Detect intent and generate response
        intent, params = detect_intent(user_input)
        response, viz_data = generate_response(graph, intent, params, user_input)
        
        # Add assistant response
        st.session_state.messages.append({
            "role": "assistant",
            "content": response
        })
        
        # Display latest interaction
        with st.chat_message("user"):
            st.markdown(user_input)
        
        with st.chat_message("assistant"):
            st.markdown(response)
            
            # Show visualization
            if viz_data.get('type') == 'taxpayer':
                st.subheader("📊 Risk Profile")
                visualize_taxpayer_profile(viz_data['data'])
                
                # Risk details table
                if viz_data['data'].get('risks'):
                    st.subheader("📋 Risk Details")
                    risks_df = pd.DataFrame([r for r in viz_data['data']['risks'] if r])
                    st.dataframe(risks_df, use_container_width=True)
            
            elif viz_data.get('type') == 'search_results':
                st.subheader("📋 Search Results")
                st.dataframe(viz_data['data'], use_container_width=True)
            
            elif viz_data.get('type') == 'related':
                st.subheader("🔗 Similar Taxpayers")
                visualize_related_taxpayers(viz_data['data'])
                st.dataframe(pd.DataFrame(viz_data['data']), use_container_width=True)
            
            elif viz_data.get('type') == 'cases':
                st.subheader("🎯 High-Impact Cases")
                st.dataframe(pd.DataFrame(viz_data['data']), use_container_width=True)
            
            elif viz_data.get('type') == 'sector':
                st.subheader("🏭 Sector Analysis")
                visualize_sector_profile(viz_data['data'])
                st.dataframe(pd.DataFrame(viz_data['data']), use_container_width=True)
        
        st.rerun()
    
    # Sidebar with quick templates
    with st.sidebar:
        st.header("⚡ Quick Templates")
        
        templates = {
            "🔍 Search by TIN": "Search 1234567890",
            "👥 Find Similar Cases": "Similar to 1234567890",
            "🎯 High Priority Cases": "High impact cases",
            "🏭 Sector Analysis": "Sector Manufacturing",
            "📍 Regional Overview": "Region Kampala",
        }
        
        for label, template in templates.items():
            if st.button(label, use_container_width=True):
                st.session_state.user_input = template
                st.rerun()
        
        st.markdown("---")
        st.subheader("📊 About TATIS360")
        st.info("""
        **T**ax **A**udit **T**axpayer **I**ntelligence **S**ystem
        
        Uses Neo4j graph traversal for:
        - Taxpayer search & profiling
        - Risk network analysis
        - Evidence gathering
        - Audit prioritization
        
        **Graph Traversal Patterns:**
        - Taxpayer → Risks
        - Risk → Similar Cases
        - Evidence → Discrepancies
        - Sector → Industry Trends
        """)

if __name__ == "__main__":
    main()
```

---

## 📋 Installation & Setup

### Step 1: Add to Streamlit app

```bash
# Copy to pages directory
cp TATIS360_CHATBOT.py /uraics/streamlit_app/pages/03_tatis360_chatbot.py
```

### Step 2: Update requirements.txt

```bash
# Add to existing requirements.txt
echo "aiohttp==3.8.5" >> requirements.txt
```

### Step 3: Add to Docker Streamlit config

```toml
# Add to .streamlit/config.toml
[client]
showChatAvatars = true

[logger]
level = "info"
```

### Step 4: Start chatbot

```bash
streamlit run home_dashboard.py
# Navigate to "TATIS360 Chatbot" in sidebar
```

---

## 🎯 Neo4j Graph Traversal Queries

### Query 1: Search by TIN (Depth 2)
```cypher
MATCH (t:Taxpayer {TIN: $tin})
OPTIONAL MATCH (t)-[flagged:FLAGGED_BY]->(rf:RiskFlag)
OPTIONAL MATCH (t)-[filed:FILED]->(ir:ITReturn)
OPTIONAL MATCH (t)-[reported:REPORTED]->(er:EFRISReturn)
```

### Query 2: Find Related Taxpayers (Depth 3)
```cypher
MATCH (t:Taxpayer {TIN: $tin})-[flagged:FLAGGED_BY]->(rf:RiskFlag)
MATCH (rf)<-[related:FLAGGED_BY]-(t2:Taxpayer)
WHERE t2.TIN <> $tin
```

### Query 3: Trace Evidence Path (Depth 4)
```cypher
MATCH (t:Taxpayer {TIN: $tin})-[flagged:FLAGGED_BY]->(rf:RiskFlag)
OPTIONAL MATCH (t)-[filed:FILED]->(ir:ITReturn)
OPTIONAL MATCH (t)-[reported:REPORTED]->(er:EFRISReturn)
OPTIONAL MATCH (ir)-[discrepancy]->(er)
```

### Query 4: Network Relationship (Depth 3)
```cypher
MATCH path = shortestPath(
    (t1:Taxpayer)-[:FLAGGED_BY*1..3]-(t2:Taxpayer)
)
```

### Query 5: Sector Analysis (Depth 2)
```cypher
MATCH (t:Taxpayer {Sector: $sector})-[flagged:FLAGGED_BY]->(rf:RiskFlag)
WITH rf, COUNT(DISTINCT t) AS prevalence, SUM(flagged.ExposureAmount) AS exposure
```

---

## 💡 Intent Detection Examples

| User Input | Intent | Action |
|-----------|--------|--------|
| "Search 1234567890" | search_tin | Get taxpayer profile |
| "Find Uganda Breweries" | search_name | Fuzzy name match |
| "Similar to TIN XYZ" | related | Network analysis |
| "Evidence for ABC" | pathway | Evidence gathering |
| "High impact cases" | high_impact | Audit prioritization |
| "Sector Manufacturing" | sector_analysis | Industry analysis |

---

## 🚀 Conversation Flow Example

```
User: "Search 1234567890"
Bot: ✅ Found Taxpayer
     Name: Uganda Breweries Ltd
     Risk Flags: 5/18
     Exposure: UGX 2.3B
     
User: "Similar to this"
Bot: ✅ Found 8 similar taxpayers
     [Network visualization]
     
User: "Show evidence for risk a"
Bot: ✅ Evidence pathway
     Risk: Presumptive Tax Underpayment
     IT Income: UGX 500M
     Actual: UGX 250M
     Variance: UGX 250M (50%)
```

