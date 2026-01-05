import oracledb
import getpass
import pandas as pd
import psycopg2
import pyodbc as odbc
from tabulate import tabulate
from sqlalchemy import create_engine, text
from datetime import datetime
import numpy as np
from typing import Dict, List, Optional, Tuple

def extract_presumptive_business_details():
    # Prompt user for credentials in the terminal
    print("--- Oracle Database Login ---")
    db_user = input("Enter Username: ")
    db_password = getpass.getpass("Enter Password: ")  # Hidden input
    
    # Configure the connection details
    conn_params = {
        "user": db_user,
        "password": db_password,
        "dsn": "exd02-c1-scan:1521/ETAXDB"
    }
    
    try:
        # Establish the database connection
        with oracledb.connect(**conn_params) as connection:
            print("\nConnection established successfully.")
            
            # Create a cursor to execute SQL queries
            with connection.cursor() as cursor:
                # Execute the SQL query to fetch presumptive business details
                cursor.execute(sql_query)
                
                # Fetch all results
                rows = cursor.fetchall()
                
                # Get column names
                columns = [desc[0] for desc in cursor.description]
                
                # Convert to DataFrame for better visualization
                df = pd.DataFrame(rows, columns=columns)
                
                # Print the results
                print("\nPresumptive Business Details:")
                print(tabulate(df, headers='keys', tablefmt='grid', showindex=False))
                
                # Also save to EXCEL
                output_file = "presumptive_business_details.xlsx"
                df.to_xlsx(output_file, index=False)
                print(f"\nResults saved to {output_file}")
                
                return df
                
    except oracledb.Error as error:
        print(f"Error connecting to database: {error}")


sql_query = """
WITH LatestReturn AS (
    SELECT 
        TAX_PAYER_ID,
        RTN_FROM_DT,
        RTN_TO_DT,
        MAX(RTN_DT) AS LATEST_RTN_DT
    FROM RTN_RETURNS_REGISTER
    WHERE form_id IN (231) 
    AND rtn_status IN ('APRV', 'BRNAPRV', 'ASMT')
    AND rtn_from_dt BETWEEN '01/07/2023' AND '31/01/2024'
    # AND TO_CHAR(rtn_from_dt, 'YYYY') IN ('2023', '2024')
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
WHERE B.TIN_NO = '1001769112'
ORDER BY 
    B.TIN_NO, 
    A.RTN_FROM_DT, 
    A.RTN_DT DESC
"""

if __name__ == "__main__":
    extract_presumptive_business_details()