/**
 * Oracle ETAXDB Service
 * Handles all queries to the Oracle database
 */

const oracledb = require("oracledb");
const config = require("../config/oracle.config");

class OracleService {
  constructor() {
    this.pool = null;
  }

  async initialize() {
    try {
      this.pool = await oracledb.createPool(config);
      console.log("Oracle connection pool created");
    } catch (error) {
      console.error("Oracle pool creation failed:", error);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.close();
      console.log("Oracle connection pool closed");
    }
  }

  async executeQuery(sql, binds = {}) {
    let connection;
    try {
      connection = await this.pool.getConnection();
      const result = await connection.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      return result.rows;
    } catch (error) {
      console.error("Oracle query error:", error);
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  /**
   * Get total taxpayers count
   */
  async getTotalTaxpayers() {
    const sql = `
      SELECT COUNT(*) as total_count
      FROM REG_TAX_PAYER_MST
      WHERE REG_STATUS = 'REGD'
    `;
    const result = await this.executeQuery(sql);
    return result[0]?.TOTAL_COUNT || 0;
  }

  /**
   * Get presumptive tax data (Risk P)
   */
  async getPresumptiveTaxData(startDate, endDate) {
    const sql = `
      WITH LatestReturn AS (
        SELECT 
            TAX_PAYER_ID,
            RTN_FROM_DT,
            RTN_TO_DT,
            MAX(RTN_DT) AS LATEST_RTN_DT
        FROM RTN_RETURNS_REGISTER
        WHERE form_id IN (231) 
        AND rtn_status IN ('APRV', 'BRNAPRV', 'ASMT')
        AND rtn_from_dt BETWEEN TO_DATE(:start_date, 'DD/MM/YYYY') AND TO_DATE(:end_date, 'DD/MM/YYYY')
        GROUP BY 
            TAX_PAYER_ID, 
            RTN_FROM_DT, 
            RTN_TO_DT
      )
      SELECT 
        A.rtn_id,
        A.rtn_no,
        A.tax_payer_id,
        B.tin_no,
        B.tax_payer_name,
        G.BSNS_NAME,
        B.IS_ACC_DT_30TH_JUNE,
        B.ACC_DT_DAY,
        B.ACC_DT_MNTH,
        STN.REG_STATION,
        STN.REGION_NAME,
        UPPER(F.tax_type_desc) TAX_TYPE,
        UPPER(E.form_name) FORM_NAME,
        A.RTN_STATUS,
        A.rtn_dt,
        TO_CHAR(A.rtn_from_dt, 'DD/MM/YYYY') RTN_FROM_DT,
        TO_CHAR(A.rtn_to_dt, 'DD/MM/YYYY') RTN_TO_DT,
        TO_CHAR(A.rtn_period_year) RTN_PERIOD_YEAR,
        A.NET_TAX,
        G.ESTIMATED_SALES_QTY TOTAL_SALES,
        G.TAX_RATE,
        G.TAX_PAYABLE
      FROM RTN_RETURNS_REGISTER A 
      JOIN LatestReturn LR ON A.TAX_PAYER_ID = LR.TAX_PAYER_ID
          AND A.RTN_FROM_DT = LR.RTN_FROM_DT
          AND A.RTN_TO_DT = LR.RTN_TO_DT
          AND A.RTN_DT = LR.LATEST_RTN_DT
      JOIN REG_TAX_PAYER_MST B ON B.TAX_PAYER_ID = A.TAX_PAYER_ID
      JOIN GEN_FORM_MST E ON E.FORM_ID = A.FORM_ID
      JOIN GEN_TAX_TYPE_MST F ON F.TAX_TYPE_ID = E.TAX_TYPE_ID
      JOIN RTN_PRSMPTV_BSNS_DTL G ON G.rtn_id = A.rtn_id
      JOIN (
          SELECT 
              ST.tin_no, 
              ST.tax_payer_id, 
              ST.replication_dt, 
              ST.created_dt, 
              ST.jurisdiction_location_id, 
              ST1.location_name REG_STATION, 
              ST2.region_name REGION_NAME
          FROM reg_tax_payer_mst ST
          JOIN gen_location_mst ST1 ON ST.jurisdiction_location_id = ST1.location_id
          JOIN gen_location_mst_rsb ST2 ON ST.jurisdiction_location_id = ST2.location_id
          WHERE ST.reg_status = 'REGD'
      ) STN ON STN.TAX_PAYER_ID = A.TAX_PAYER_ID
      ORDER BY 
          B.TIN_NO, 
          A.RTN_FROM_DT, 
          A.RTN_DT DESC
    `;

    return await this.executeQuery(sql, {
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get risk data by risk type
   * Uses SQL queries from risk-queries.js
   */
  async getRiskData(riskId, filters = {}) {
    const riskQueries = require("../queries/risk-queries");

    if (!riskQueries[riskId]) {
      throw new Error(`Risk type ${riskId} not implemented`);
    }

    let query = riskQueries[riskId];

    // Replace placeholders if they exist
    if (filters.startDate && query.includes(":start_date")) {
      query = query.replace(":start_date", `'${filters.startDate}'`);
    }
    if (filters.endDate && query.includes(":end_date")) {
      query = query.replace(":end_date", `'${filters.endDate}'`);
    }

    return await this.executeQuery(query, filters);
  }
}

module.exports = new OracleService();

