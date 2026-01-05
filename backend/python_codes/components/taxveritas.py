## 🔍 TaxVeritas Component: `streamlit/components/taxveritas.py`
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from database.neo4j_connection import execute_query

def render_taxveritas(graph):
    """
    TaxVeritas: Single taxpayer subgraph analysis
    """
    
    st.subheader("🔍 TaxVeritas - Taxpayer Subgraph Analysis")
    st.caption("Search by TIN to view complete taxpayer profile, filing history, and risk flags")
    
    # ─────────────────────────────────────────────────────────────────────
    # TIN SEARCH
    # ─────────────────────────────────────────────────────────────────────
    
    tin_search = st.text_input("Enter TIN Number", placeholder="e.g., 1001769112")
    
    if not tin_search or len(tin_search) != 10:
        st.info("👆 Enter a 10-digit TIN to search")
        return
    
    st.divider()
    
    # ─────────────────────────────────────────────────────────────────────
    # TAXPAYER PROFILE
    # ─────────────────────────────────────────────────────────────────────
    
    profile_query = f"""
    MATCH (t:Taxpayer {{TIN: '{tin_search}'}})
    RETURN 
      t.TIN as tin,
      t.Name as name,
      t.TAX_PAYER_ID as tax_payer_id,
      t.RiskScore as risk_score,
      t.Status as status
    """
    
    profile_data = execute_query(graph, profile_query)
    
    if not profile_data:
        st.error(f"❌ TIN {tin_search} not found in Neo4j")
        return
    
    profile = profile_data[0]
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("TIN", profile['tin'])
    with col2:
        st.metric("Name", profile['name'])
    with col3:
        st.metric("Risk Score", f"{profile.get('risk_score', 0):.1f}/100")
    with col4:
        st.metric("Status", profile.get('status', 'Unknown'))
    
    st.divider()
    
    # ─────────────────────────────────────────────────────────────────────
    # FILING HISTORY
    # ─────────────────────────────────────────────────────────────────────
    
    st.subheader("📋 Filing History")
    
    filing_query = f"""
    MATCH (t:Taxpayer {{TIN: '{tin_search}'}})-[filed:FILED]->(ir:ITReturn)
    RETURN 
      ir.ReturnID as return_id,
      ir.Year as year,
      ir.GrossTurnover as gross_turnover,
      ir.TaxableIncome as taxable_income,
      ir.TaxDue as tax_due,
      ir.FilingDate as filing_date,
      ir.Status as status
    ORDER BY ir.Year DESC
    LIMIT 10
    """
    
    filing_data = execute_query(graph, filing_query)
    
    if filing_data:
        df_filing = pd.DataFrame(filing_data)
        st.dataframe(df_filing, use_container_width=True)
    else:
        st.info("No filing history found")
    
    st.divider()
    
    # ─────────────────────────────────────────────────────────────────────
    # RISK FLAGS
    # ─────────────────────────────────────────────────────────────────────
    
    st.subheader("⚠️ Risk Flags for This Taxpayer")
    
    risk_query = f"""
    MATCH (t:Taxpayer {{TIN: '{tin_search}'}})-[flag:FLAGGED_BY]->(r:RiskFlag)
    RETURN 
      r.RiskID as risk_id,
      r.RiskName as risk_name,
      r.Severity as severity,
      flag.ExposureAmount as exposure,
      flag.DetectedDate as detected_date
    ORDER BY flag.ExposureAmount DESC
    """
    
    risk_data = execute_query(graph, risk_query)
    
    if risk_data:
        for risk in risk_data:
            severity_icon = {
                'Critical': '🔴',
                'High': '🟠',
                'Medium': '🟡',
                'Low': '🟢'
            }.get(risk.get('severity'), '⚪')
            
            col1, col2 = st.columns([3, 1])
            with col1:
                st.warning(
                    f"{severity_icon} **Risk {risk.get('risk_id').upper()}**: {risk.get('risk_name')}\n"
                    f"Exposure: UGX {risk.get('exposure')/1e6:.1f}M | Detected: {risk.get('detected_date')}"
                )
            with col2:
                if st.button("View", key=f"view_risk_{risk.get('risk_id')}"):
                    st.session_state.selected_risk = risk.get('risk_id')
    else:
        st.success("✅ No risk flags found - this taxpayer is compliant!")

if __name__ == "__main__":
    from database.neo4j_connection import get_neo4j_connection
    graph = get_neo4j_connection()
    if graph:
        render_taxveritas(graph)
