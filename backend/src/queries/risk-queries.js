/**
 * Risk Type SQL Queries
 * Contains SQL queries for all 19 risk types (a-s)
 * These queries will be executed against Oracle ETAXDB
 */

module.exports = {
  /**
   * Risk A: Industrial Building Deduction without Land & Building
   */
  a: `
    SELECT 
      B.TIN_NO,
      B.TAX_PAYER_NAME,
      B.TAX_PAYER_ID,
      STN.REG_STATION,
      STN.REGION_NAME,
      A.RTN_ID,
      A.RTN_NO,
      A.RTN_FROM_DT,
      A.RTN_TO_DT,
      -- Check if taxpayer claimed deduction but has no land/building in balance sheet
      CASE WHEN ASM.ALLOW_IND_BUILD_DTL_ID IS NOT NULL 
           AND (PL.ASSET_TYPE IS NULL OR PL.ASSET_TYPE NOT IN ('LAND', 'BUILDING'))
           THEN 1 ELSE 0 END AS FLAGGED,
      ASM.ALLOW_IND_BUILD_AMT AS EXPOSURE
    FROM RTN_RETURNS_REGISTER A
    JOIN REG_TAX_PAYER_MST B ON B.TAX_PAYER_ID = A.TAX_PAYER_ID
    LEFT JOIN ASM_ALLOW_IND_BUILD_DTL ASM ON ASM.RTN_ID = A.RTN_ID
    LEFT JOIN ASM_PROFIT_LOSS_DEBIT_DTL PL ON PL.RTN_ID = A.RTN_ID
    JOIN (
      SELECT 
        ST.tin_no, 
        ST.tax_payer_id,
        ST1.location_name REG_STATION, 
        ST2.region_name REGION_NAME
      FROM reg_tax_payer_mst ST
      JOIN gen_location_mst ST1 ON ST.jurisdiction_location_id = ST1.location_id
      JOIN gen_location_mst_rsb ST2 ON ST.jurisdiction_location_id = ST2.location_id
      WHERE ST.reg_status = 'REGD'
    ) STN ON STN.TAX_PAYER_ID = A.TAX_PAYER_ID
    WHERE A.RTN_STATUS IN ('APRV', 'BRNAPRV', 'ASMT')
    AND ASM.ALLOW_IND_BUILD_DTL_ID IS NOT NULL
    ORDER BY B.TIN_NO, A.RTN_FROM_DT DESC
  `,

  /**
   * Risk B: Variance between sales in IT return and EFRIS
   */
  b: `
    SELECT 
      B.TIN_NO,
      B.TAX_PAYER_NAME,
      B.TAX_PAYER_ID,
      STN.REG_STATION,
      STN.REGION_NAME,
      A.RTN_ID,
      A.RTN_NO,
      A.RTN_FROM_DT,
      A.RTN_TO_DT,
      RTN.TOTAL_SALES AS IT_SALES,
      EFRIS.TOTAL_SALES AS EFRIS_SALES,
      ABS(RTN.TOTAL_SALES - EFRIS.TOTAL_SALES) AS VARIANCE,
      CASE WHEN ABS(RTN.TOTAL_SALES - EFRIS.TOTAL_SALES) > (RTN.TOTAL_SALES * 0.1)
           THEN 1 ELSE 0 END AS FLAGGED,
      ABS(RTN.TOTAL_SALES - EFRIS.TOTAL_SALES) AS EXPOSURE
    FROM RTN_RETURNS_REGISTER A
    JOIN REG_TAX_PAYER_MST B ON B.TAX_PAYER_ID = A.TAX_PAYER_ID
    JOIN RTN_BSNS_PROF_INCOME_DTL RTN ON RTN.RTN_ID = A.RTN_ID
    LEFT JOIN (
      SELECT TIN_NO, SUM(INVOICE_AMOUNT) AS TOTAL_SALES
      FROM MV_EFRIS_FLAGGED_INVOICES
      GROUP BY TIN_NO
    ) EFRIS ON EFRIS.TIN_NO = B.TIN_NO
    JOIN (
      SELECT 
        ST.tin_no, 
        ST.tax_payer_id,
        ST1.location_name REG_STATION, 
        ST2.region_name REGION_NAME
      FROM reg_tax_payer_mst ST
      JOIN gen_location_mst ST1 ON ST.jurisdiction_location_id = ST1.location_id
      JOIN gen_location_mst_rsb ST2 ON ST.jurisdiction_location_id = ST2.location_id
      WHERE ST.reg_status = 'REGD'
    ) STN ON STN.TAX_PAYER_ID = A.TAX_PAYER_ID
    WHERE A.RTN_STATUS IN ('APRV', 'BRNAPRV', 'ASMT')
    AND EFRIS.TOTAL_SALES IS NOT NULL
    ORDER BY VARIANCE DESC
  `,

  /**
   * Risk C: Variance between sales in IT return and WHT
   */
  c: `
    SELECT 
      B.TIN_NO,
      B.TAX_PAYER_NAME,
      B.TAX_PAYER_ID,
      STN.REG_STATION,
      STN.REGION_NAME,
      A.RTN_ID,
      A.RTN_NO,
      A.RTN_FROM_DT,
      A.RTN_TO_DT,
      RTN.TOTAL_SALES AS IT_SALES,
      WHT.TOTAL_PAYMENT AS WHT_PAYMENT,
      ABS(RTN.TOTAL_SALES - WHT.TOTAL_PAYMENT) AS VARIANCE,
      CASE WHEN ABS(RTN.TOTAL_SALES - WHT.TOTAL_PAYMENT) > (RTN.TOTAL_SALES * 0.1)
           THEN 1 ELSE 0 END AS FLAGGED,
      ABS(RTN.TOTAL_SALES - WHT.TOTAL_PAYMENT) AS EXPOSURE
    FROM RTN_RETURNS_REGISTER A
    JOIN REG_TAX_PAYER_MST B ON B.TAX_PAYER_ID = A.TAX_PAYER_ID
    JOIN RTN_BSNS_PROF_INCOME_DTL RTN ON RTN.RTN_ID = A.RTN_ID
    LEFT JOIN (
      SELECT TAX_PAYER_ID, SUM(TAX_AMOUNT) AS TOTAL_PAYMENT
      FROM RTN_WITHHOLD_DEDUCT_DTL
      GROUP BY TAX_PAYER_ID
    ) WHT ON WHT.TAX_PAYER_ID = A.TAX_PAYER_ID
    JOIN (
      SELECT 
        ST.tin_no, 
        ST.tax_payer_id,
        ST1.location_name REG_STATION, 
        ST2.region_name REGION_NAME
      FROM reg_tax_payer_mst ST
      JOIN gen_location_mst ST1 ON ST.jurisdiction_location_id = ST1.location_id
      JOIN gen_location_mst_rsb ST2 ON ST.jurisdiction_location_id = ST2.location_id
      WHERE ST.reg_status = 'REGD'
    ) STN ON STN.TAX_PAYER_ID = A.TAX_PAYER_ID
    WHERE A.RTN_STATUS IN ('APRV', 'BRNAPRV', 'ASMT')
    AND WHT.TOTAL_PAYMENT IS NOT NULL
    ORDER BY VARIANCE DESC
  `,

  /**
   * Risk P: Presumptive taxpayers with gross turnover above 150 million
   */
  p: `
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
      GROUP BY TAX_PAYER_ID, RTN_FROM_DT, RTN_TO_DT
    )
    SELECT 
      A.rtn_id,
      A.rtn_no,
      A.tax_payer_id,
      B.tin_no,
      B.tax_payer_name,
      G.BSNS_NAME,
      STN.REG_STATION,
      STN.REGION_NAME,
      A.RTN_STATUS,
      TO_CHAR(A.rtn_from_dt, 'DD/MM/YYYY') RTN_FROM_DT,
      TO_CHAR(A.rtn_to_dt, 'DD/MM/YYYY') RTN_TO_DT,
      G.ESTIMATED_SALES_QTY TOTAL_SALES,
      G.TAX_RATE,
      G.TAX_PAYABLE,
      CASE WHEN G.ESTIMATED_SALES_QTY > 150000000 THEN 1 ELSE 0 END AS FLAGGED,
      CASE WHEN G.ESTIMATED_SALES_QTY > 150000000 THEN G.TAX_PAYABLE ELSE 0 END AS EXPOSURE
    FROM RTN_RETURNS_REGISTER A 
    JOIN LatestReturn LR ON A.TAX_PAYER_ID = LR.TAX_PAYER_ID
      AND A.RTN_FROM_DT = LR.RTN_FROM_DT
      AND A.RTN_TO_DT = LR.RTN_TO_DT
      AND A.RTN_DT = LR.LATEST_RTN_DT
    JOIN REG_TAX_PAYER_MST B ON B.TAX_PAYER_ID = A.TAX_PAYER_ID
    JOIN RTN_PRSMPTV_BSNS_DTL G ON G.rtn_id = A.rtn_id
    JOIN (
      SELECT 
        ST.tin_no, 
        ST.tax_payer_id,
        ST1.location_name REG_STATION, 
        ST2.region_name REGION_NAME
      FROM reg_tax_payer_mst ST
      JOIN gen_location_mst ST1 ON ST.jurisdiction_location_id = ST1.location_id
      JOIN gen_location_mst_rsb ST2 ON ST.jurisdiction_location_id = ST2.location_id
      WHERE ST.reg_status = 'REGD'
    ) STN ON STN.TAX_PAYER_ID = A.TAX_PAYER_ID
    WHERE G.ESTIMATED_SALES_QTY > 150000000
    ORDER BY G.ESTIMATED_SALES_QTY DESC
  `,

  // Placeholder queries for other risk types
  // These will be implemented based on specific business logic
  d: `-- Risk D: IT Returns Missing, EFRIS Activity Present
    SELECT 
      EFRIS.TIN_NO,
      B.TAX_PAYER_NAME,
      EFRIS.TOTAL_SALES,
      CASE WHEN A.RTN_ID IS NULL THEN 1 ELSE 0 END AS FLAGGED,
      EFRIS.TOTAL_SALES * 0.18 AS EXPOSURE
    FROM (
      SELECT TIN_NO, SUM(INVOICE_AMOUNT) AS TOTAL_SALES
      FROM MV_EFRIS_FLAGGED_INVOICES
      GROUP BY TIN_NO
    ) EFRIS
    LEFT JOIN REG_TAX_PAYER_MST B ON B.TIN_NO = EFRIS.TIN_NO
    LEFT JOIN RTN_RETURNS_REGISTER A ON A.TAX_PAYER_ID = B.TAX_PAYER_ID
      AND A.RTN_STATUS IN ('APRV', 'BRNAPRV', 'ASMT')
    WHERE A.RTN_ID IS NULL
    ORDER BY EFRIS.TOTAL_SALES DESC
  `,

  e: `-- Risk E: IT Returns Missing, WHT Activity Present
    SELECT 
      WHT.TIN_NO,
      B.TAX_PAYER_NAME,
      WHT.TOTAL_WHT,
      CASE WHEN A.RTN_ID IS NULL THEN 1 ELSE 0 END AS FLAGGED,
      WHT.TOTAL_WHT AS EXPOSURE
    FROM (
      SELECT TIN_NO, SUM(TAX_AMOUNT) AS TOTAL_WHT
      FROM RTN_WITHHOLD_DEDUCT_DTL
      GROUP BY TIN_NO
    ) WHT
    LEFT JOIN REG_TAX_PAYER_MST B ON B.TIN_NO = WHT.TIN_NO
    LEFT JOIN RTN_RETURNS_REGISTER A ON A.TAX_PAYER_ID = B.TAX_PAYER_ID
      AND A.RTN_STATUS IN ('APRV', 'BRNAPRV', 'ASMT')
    WHERE A.RTN_ID IS NULL
    ORDER BY WHT.TOTAL_WHT DESC
  `,

  // Additional risk queries will be added here...
  // f, g, h, i, j, k, l, m, n, o, q, r, s
};

