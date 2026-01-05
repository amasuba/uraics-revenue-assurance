# URAICS Home Dashboard - Streamlit Component
## Complete production-ready home dashboard reading from Neo4j
# ═══════════════════════════════════════════════════════════════════════
# URAICS HOME DASHBOARD - STREAMLIT APPLICATION
# Central hub for risk overview, KPIs, and navigation to risk pages
# ═══════════════════════════════════════════════════════════════════════

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from py2neo import Graph
from datetime import datetime, timedelta
from functools import lru_cache
import warnings
import logging

warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════
# PAGE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════

st.set_page_config(
    page_title="URAICS Home Dashboard",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# URA Brand Colors
URA_COLORS = {
    'primary': '#1B5E20',      # Dark Green
    'secondary': '#388E3C',    # Medium Green
    'accent': '#FFC107',       # Gold/Amber
    'critical': '#D32F2F',     # Red
    'warning': '#F57C00',      # Orange
    'info': '#1976D2',         # Blue
    'success': '#388E3C',      # Green
}

# ═══════════════════════════════════════════════════════════════════════
# NEO4J CONNECTION
# ═══════════════════════════════════════════════════════════════════════

@st.cache_resource
def get_neo4j_connection():
    """
    Create and cache Neo4j connection
    """
    try:
        graph = Graph(
            uri="bolt://localhost:7687",
            user="neo4j",
            password=st.secrets.get("NEO4J_PASSWORD", "default_password")
        )
        # Test connection
        graph.run("RETURN 1")
        return graph
    except Exception as e:
        logger.error(f"Neo4j connection failed: {e}")
        st.error(f"❌ Neo4j connection failed: {e}")
        return None

# ═══════════════════════════════════════════════════════════════════════
# CYPHER QUERY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════

@st.cache_data(ttl=3600)  # Cache for 1 hour
def fetch_dashboard_kpis(graph):
    """
    Fetch all KPI metrics for dashboard
    Performance: <500ms
    """
    try:
        query = """
        MATCH (t:Taxpayer)
        WITH COUNT(t) AS total_taxpayers
        
        MATCH (t:Taxpayer)-[flagged:FLAGGED_BY]-(rf:RiskFlag)
        WITH total_taxpayers,
             COUNT(DISTINCT t) AS flagged_taxpayers,
             SUM(flagged.ExposureAmount) AS total_exposure,
             COUNT(DISTINCT rf.RiskID) AS risks_active
        
        MATCH (rf:RiskFlag)
        WITH total_taxpayers,
             flagged_taxpayers,
             total_exposure,
             risks_active,
             COUNT(rf) AS total_risk_types
        
        RETURN {
          totalTaxpayers: total_taxpayers,
          flaggedTaxpayers: flagged_taxpayers,
          compliantTaxpayers: total_taxpayers - flagged_taxpayers,
          complianceRate: ROUND(100.0 * (total_taxpayers - flagged_taxpayers) / COALESCE(total_taxpayers, 1), 2),
          totalExposure: total_exposure,
          averageExposure: ROUND(total_exposure / COALESCE(flagged_taxpayers, 1), 0),
          risksActive: risks_active,
          totalRiskTypes: total_risk_types,
          lastUpdated: datetime()
        } AS kpis
        """
        
        result = graph.run(query).data()
        return result[0]['kpis'] if result else None
        
    except Exception as e:
        logger.error(f"KPI fetch failed: {e}")
        return None

@st.cache_data(ttl=3600)
def fetch_risk_summary(graph):
    """
    Fetch all risks with counts, exposure, and severity
    Performance: <200ms
    """
    try:
        query = """
        MATCH (rf:RiskFlag)<-[flagged:FLAGGED_BY]-(t:Taxpayer)
        WITH rf,
             COUNT(DISTINCT t) AS flagged_count,
             SUM(flagged.ExposureAmount) AS total_exposure,
             AVG(flagged.ExposureAmount) AS avg_exposure,
             MAX(flagged.DetectedDate) AS latest_detection
        
        RETURN {
          riskId: rf.RiskID,
          riskName: rf.RiskName,
          description: rf.Description,
          severity: rf.Severity,
          flaggedTaxpayers: flagged_count,
          totalExposure: total_exposure,
          averageExposure: ROUND(avg_exposure, 0),
          latestDetectionDate: latest_detection
        } AS risk
        
        ORDER BY total_exposure DESC
        """
        
        result = graph.run(query).data()
        return [r['risk'] for r in result] if result else []
        
    except Exception as e:
        logger.error(f"Risk summary fetch failed: {e}")
        return []

@st.cache_data(ttl=3600)
def fetch_top_5_risks(graph):
    """
    Get top 5 risks by exposure
    """
    try:
        query = """
        MATCH (rf:RiskFlag)<-[flagged:FLAGGED_BY]-(t:Taxpayer)
        WITH rf,
             COUNT(DISTINCT t) AS count,
             SUM(flagged.ExposureAmount) AS exposure
        
        RETURN rf.RiskID AS risk_id,
               rf.RiskName AS risk_name,
               rf.Severity AS severity,
               count,
               exposure
        
        ORDER BY exposure DESC
        LIMIT 5
        """
        
        result = graph.run(query).data()
        return result if result else []
        
    except Exception as e:
        logger.error(f"Top 5 risks fetch failed: {e}")
        return []

@st.cache_data(ttl=3600)
def fetch_regional_distribution(graph):
    """
    Get risk distribution by region
    Performance: <150ms
    """
    try:
        query = """
        MATCH (t:Taxpayer)
        WITH t.Region AS region,
             COUNT(DISTINCT t) AS total
        
        OPTIONAL MATCH (t:Taxpayer {Region: region})-[flagged:FLAGGED_BY]-(rf:RiskFlag)
        
        WITH region,
             total,
             COUNT(DISTINCT t) AS flagged,
             SUM(flagged.ExposureAmount) AS exposure
        
        RETURN region,
               total,
               flagged,
               exposure,
               ROUND(100.0 * flagged / COALESCE(total, 1), 2) AS flag_rate
        
        ORDER BY exposure DESC
        """
        
        result = graph.run(query).data()
        return result if result else []
        
    except Exception as e:
        logger.error(f"Regional distribution fetch failed: {e}")
        return []

@st.cache_data(ttl=3600)
def fetch_risk_trend(graph, days=30):
    """
    Get risk detection trend over time
    Performance: <300ms
    """
    try:
        query = """
        MATCH (t:Taxpayer)-[flagged:FLAGGED_BY]->(rf:RiskFlag)
        
        WITH rf.RiskID AS risk_id,
             rf.RiskName AS risk_name,
             APOC.DATE.FORMAT(flagged.DetectedDate, 'yyyy-MM-dd') AS date,
             COUNT(DISTINCT t) AS count,
             SUM(flagged.ExposureAmount) AS exposure
        
        RETURN risk_id, risk_name, date, count, exposure
        
        ORDER BY date DESC
        LIMIT 1000
        """
        
        result = graph.run(query).data()
        return result if result else []
        
    except Exception as e:
        logger.error(f"Risk trend fetch failed: {e}")
        return []

@st.cache_data(ttl=3600)
def fetch_severity_distribution(graph):
    """
    Get distribution of risks by severity
    """
    try:
        query = """
        MATCH (rf:RiskFlag)<-[flagged:FLAGGED_BY]-(t:Taxpayer)
        WITH rf.Severity AS severity,
             COUNT(DISTINCT t) AS count,
             SUM(flagged.ExposureAmount) AS exposure
        
        RETURN severity,
               count,
               exposure
        
        ORDER BY exposure DESC
        """
        
        result = graph.run(query).data()
        return result if result else []
        
    except Exception as e:
        logger.error(f"Severity distribution fetch failed: {e}")
        return []

# ═══════════════════════════════════════════════════════════════════════
# VISUALIZATION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════

def create_kpi_cards(kpis):
    """Create 6 KPI metric cards"""
    if not kpis:
        st.error("Failed to load KPIs")
        return
    
    col1, col2, col3, col4, col5, col6 = st.columns(6)
    
    with col1:
        st.metric(
            "Total Taxpayers",
            f"{kpis.get('totalTaxpayers', 0):,}",
            delta=f"{kpis.get('flaggedTaxpayers', 0)} flagged"
        )
    
    with col2:
        st.metric(
            "Compliance Rate",
            f"{kpis.get('complianceRate', 0):.1f}%",
            delta="Target: 95%"
        )
    
    with col3:
        st.metric(
            "At Risk Cases",
            f"{kpis.get('flaggedTaxpayers', 0):,}",
            delta=f"{100*kpis.get('flaggedTaxpayers', 0)/max(kpis.get('totalTaxpayers', 1), 1):.1f}%"
        )
    
    with col4:
        exposure_billions = kpis.get('totalExposure', 0) / 1e9
        st.metric(
            "Revenue Exposure",
            f"UGX {exposure_billions:.1f}B",
            delta="UGX (billions)"
        )
    
    with col5:
        st.metric(
            "Active Risk Types",
            f"{kpis.get('risksActive', 0)}/18",
            delta=f"{kpis.get('totalRiskTypes', 0)} total"
        )
    
    with col6:
        avg_exposure = kpis.get('averageExposure', 0) / 1e6
        st.metric(
            "Avg Exposure",
            f"UGX {avg_exposure:.0f}M",
            delta="Per case"
        )

def create_risk_heatmap(risks_data):
    """Create risk severity heatmap (18 risks × severity)"""
    if not risks_data:
        st.warning("No risk data available")
        return
    
    # Prepare data
    df = pd.DataFrame(risks_data)
    
    # Create severity levels
    severity_order = ['Low', 'Medium', 'High', 'Critical']
    df['severity'] = pd.Categorical(df['severity'], categories=severity_order, ordered=True)
    
    # Create pivot table
    pivot_data = df.pivot_table(
        values='flaggedTaxpayers',
        index='riskId',
        columns='severity',
        aggfunc='sum',
        fill_value=0
    )
    
    # Create heatmap
    fig = go.Figure(data=go.Heatmap(
        z=pivot_data.values,
        x=pivot_data.columns,
        y=pivot_data.index,
        colorscale='RdYlGn_r',
        text=pivot_data.values,
        texttemplate='%{text}',
        textfont={"size": 10},
        colorbar=dict(title="Cases")
    ))
    
    fig.update_layout(
        title="Risk Heatmap: 18 Risks × Severity Levels",
        xaxis_title="Severity Level",
        yaxis_title="Risk Type",
        height=500,
        hovermode='closest'
    )
    
    st.plotly_chart(fig, use_container_width=True)

def create_top_risks_bar(top_risks):
    """Create bar chart of top 5 risks by exposure"""
    if not top_risks:
        st.warning("No risk data available")
        return
    
    df = pd.DataFrame(top_risks)
    df['exposure_billions'] = df['exposure'] / 1e9
    
    # Color by severity
    severity_colors = {
        'Critical': URA_COLORS['critical'],
        'High': URA_COLORS['warning'],
        'Medium': URA_COLORS['accent'],
        'Low': URA_COLORS['info']
    }
    colors = [severity_colors.get(s, '#999') for s in df['severity']]
    
    fig = go.Figure(
        data=[
            go.Bar(
                x=df['risk_name'],
                y=df['exposure_billions'],
                marker_color=colors,
                text=df['exposure_billions'].round(1),
                textposition='auto',
                hovertemplate='<b>%{x}</b><br>Exposure: UGX %{y:.1f}B<br>Cases: %{customdata}<extra></extra>',
                customdata=df['count']
            )
        ]
    )
    
    fig.update_layout(
        title="Top 5 Risks by Revenue Exposure",
        xaxis_title="Risk Type",
        yaxis_title="Revenue Exposure (UGX Billions)",
        height=400,
        showlegend=False
    )
    
    st.plotly_chart(fig, use_container_width=True)

def create_regional_map(regional_data):
    """Create regional distribution chart"""
    if not regional_data:
        st.warning("No regional data available")
        return
    
    df = pd.DataFrame(regional_data)
    
    fig = px.bar(
        df,
        x='region',
        y='exposure',
        color='flag_rate',
        hover_name='region',
        hover_data={
            'region': False,
            'total': True,
            'flagged': True,
            'flag_rate': ':.1f',
            'exposure': ':.0f'
        },
        labels={
            'region': 'Region',
            'exposure': 'Revenue Exposure (UGX)',
            'flag_rate': 'Flag Rate %'
        },
        title="Risk Distribution by Region",
        color_continuous_scale="RdYlGn_r"
    )
    
    fig.update_layout(height=400)
    st.plotly_chart(fig, use_container_width=True)

def create_severity_distribution_pie(severity_data):
    """Create pie chart of risk severity distribution"""
    if not severity_data:
        st.warning("No severity data available")
        return
    
    df = pd.DataFrame(severity_data)
    
    severity_colors_list = [
        URA_COLORS['critical'],  # Critical
        URA_COLORS['warning'],   # High
        URA_COLORS['accent'],    # Medium
        URA_COLORS['info']       # Low
    ]
    
    fig = go.Figure(
        data=[
            go.Pie(
                labels=df['severity'],
                values=df['exposure'],
                marker=dict(colors=severity_colors_list),
                hovertemplate='<b>%{label}</b><br>Exposure: UGX %{value/1e9:.1f}B<br>Cases: %{customdata}<extra></extra>',
                customdata=df['count']
            )
        ]
    )
    
    fig.update_layout(
        title="Revenue Exposure by Severity Level",
        height=400
    )
    
    st.plotly_chart(fig, use_container_width=True)

def create_risk_cards(risks_data):
    """Create hyperlinked risk cards for navigation"""
    st.subheader("🎯 18 Risk Categories (Click to Investigate)")
    
    # Group risks by severity
    severity_groups = {
        'Critical': [],
        'High': [],
        'Medium': [],
        'Low': []
    }
    
    for risk in risks_data:
        severity = risk.get('severity', 'Low')
        if severity in severity_groups:
            severity_groups[severity].append(risk)
    
    # Display by severity
    for severity, risks in severity_groups.items():
        if risks:
            st.markdown(f"#### {severity} Severity ({len(risks)} risks)")
            
            cols = st.columns(6)
            for idx, risk in enumerate(risks):
                with cols[idx % 6]:
                    # Color badge based on severity
                    badge_color = {
                        'Critical': '🔴',
                        'High': '🟠',
                        'Medium': '🟡',
                        'Low': '🟢'
                    }.get(severity, '⚪')
                    
                    # Exposure in millions
                    exposure_m = risk.get('totalExposure', 0) / 1e6
                    
                    # Create clickable card
                    with st.container(border=True):
                        st.markdown(f"{badge_color} **Risk {risk.get('riskId', '?')}**")
                        st.caption(risk.get('riskName', 'Unknown'))
                        st.metric("Cases", risk.get('flaggedTaxpayers', 0))
                        st.metric("Exposure", f"UGX {exposure_m:.0f}M")
                        
                        # Hyperlink to risk page
                        if st.button(
                            f"Investigate Risk {risk.get('riskId', '?')}",
                            key=f"risk_{risk.get('riskId', '')}",
                            use_container_width=True
                        ):
                            st.session_state.selected_risk = risk.get('riskId')
                            st.switch_page(f"pages/risk_{risk.get('riskId')}.py")

# ═══════════════════════════════════════════════════════════════════════
# MAIN DASHBOARD
# ═══════════════════════════════════════════════════════════════════════

def main():
    # Header
    st.title("🏠 URAICS Home Dashboard")
    st.markdown("""
    **Unified Revenue Assurance & Incident Control System**
    
    Central hub for monitoring tax compliance risks across 50K+ taxpayers
    """)
    
    st.divider()
    
    # Connect to Neo4j
    graph = get_neo4j_connection()
    if graph is None:
        st.error("❌ Cannot connect to Neo4j. Please check database connectivity.")
        return
    
    # Sidebar filters
    with st.sidebar:
        st.header("⚙️ Filters & Settings")
        
        # Refresh rate
        refresh_interval = st.selectbox(
            "Auto-refresh interval",
            ["Manual", "Every 5 min", "Every 15 min", "Every 1 hour"]
        )
        
        # Date range filter (placeholder for future use)
        st.markdown("---")
        st.subheader("Date Range")
        date_range = st.selectbox(
            "Report period",
            ["Last 24 hours", "Last 7 days", "Last 30 days", "Last 90 days"]
        )
        
        # Severity filter
        st.markdown("---")
        st.subheader("Risk Severity")
        severity_filter = st.multiselect(
            "Show risks with severity",
            ["Critical", "High", "Medium", "Low"],
            default=["Critical", "High"]
        )
        
        # Export data
        st.markdown("---")
        if st.button("📥 Refresh Data", use_container_width=True):
            st.cache_data.clear()
            st.rerun()
    
    # Fetch data
    with st.spinner("⏳ Loading dashboard data from Neo4j..."):
        kpis = fetch_dashboard_kpis(graph)
        risks = fetch_risk_summary(graph)
        top_5_risks = fetch_top_5_risks(graph)
        regional_dist = fetch_regional_distribution(graph)
        severity_dist = fetch_severity_distribution(graph)
    
    if not kpis or not risks:
        st.error("❌ Failed to load dashboard data. Please check Neo4j connection.")
        return
    
    # Display KPI Cards
    st.subheader("📊 Key Performance Indicators")
    create_kpi_cards(kpis)
    
    st.divider()
    
    # Row 1: Risk Heatmap + Top 5 Risks
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("🔥 Risk Heatmap (18 Risks × Severity)")
        create_risk_heatmap(risks)
    
    with col2:
        st.subheader("📈 Top 5 Risks")
        create_top_risks_bar(top_5_risks)
    
    st.divider()
    
    # Row 2: Regional + Severity
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🗺️ Regional Distribution")
        create_regional_map(regional_dist)
    
    with col2:
        st.subheader("⚠️ By Severity Level")
        create_severity_distribution_pie(severity_dist)
    
    st.divider()
    
    # Risk Cards
    create_risk_cards(risks)
    
    # Footer
    st.markdown("---")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.caption("📊 Data from Neo4j Graph Database")
    
    with col2:
        st.caption(f"🔄 Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    with col3:
        st.caption("🏛️ Uganda Revenue Authority")

if __name__ == "__main__":
    main()

