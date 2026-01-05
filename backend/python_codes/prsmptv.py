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
import os
from pathlib import Path

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

            # Prompt for date range parameters (defaults)
            default_start = input("Enter start date (DD/MM/YYYY) [01/07/2023]: ") or "01/07/2023"
            default_end = input("Enter end date (DD/MM/YYYY) [31/01/2024]: ") or "31/01/2024"

            # Create a cursor to execute SQL queries
            with connection.cursor() as cursor:
                # Attempt a parse-only check if supported to avoid executing triggers
                try:
                    if hasattr(cursor, 'prepare'):
                        cursor.prepare(sql_query)
                        print("SQL parsed successfully (cursor.prepare). No execution performed.")
                    else:
                        try:
                            cursor.execute(f"SELECT * FROM ( {sql_query} ) WHERE 1=0", start_date=default_start, end_date=default_end)
                            print("SQL parsed successfully via zero-row execution.")
                        except Exception:
                            print("Could not do a safe parse-only check. Proceeding with caution.")
                except Exception as e:
                    print(f"Parse-only check failed: {e}")

                proceed = input("Proceed to execute query and fetch results? [y/N]: ") or 'N'
                if proceed.strip().lower() != 'y':
                    print("Aborting execution as requested.")
                    return None

                # Execute the SQL query to fetch presumptive business details using binds
                try:
                    cursor.execute(sql_query, {"start_date": default_start, "end_date": default_end})
                except oracledb.DatabaseError as e:
                    print(f"Error executing query: {e}")
                    raise

                # Fetch all results
                rows = cursor.fetchall()

                # Get column names
                columns = [desc[0] for desc in cursor.description]

                # Convert to DataFrame for better visualization
                df = pd.DataFrame(rows, columns=columns)

                # Print the results
                print("\nPresumptive Business Details:")
                print(tabulate(df, headers='keys', tablefmt='grid', showindex=False))

                # Also save a quick CSV export (write into exports/ to avoid permission problems)
                export_dir = Path("exports")
                export_dir.mkdir(parents=True, exist_ok=True)
                csv_file = export_dir / "presumptive_business_details.csv"

                def safe_write_csv(path: Path, df_to_write: pd.DataFrame):
                    try:
                        df_to_write.to_csv(path, index=False)
                        print(f"\nResults saved to {path}")
                        return path
                    except PermissionError:
                        alt = path.with_name(path.stem + f"_{int(datetime.now().timestamp())}" + path.suffix)
                        df_to_write.to_csv(alt, index=False)
                        print(f"\nPermission error; saved CSV to {alt}")
                        return alt

                safe_write_csv(csv_file, df)

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
    AND rtn_from_dt BETWEEN TO_DATE(:start_date, 'DD/MM/YYYY') AND TO_DATE(:end_date, 'DD/MM/YYYY')
    -- AND TO_CHAR(rtn_from_dt, 'YYYY') IN ('2023', '2024')
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
"""

if __name__ == "__main__":
    df = extract_presumptive_business_details()
    # If we got a DataFrame, process exports and summaries
    if df is not None and not df.empty:
        def get_financial_year(dt: datetime) -> str:
            # dt is a pandas.Timestamp or datetime
            year = dt.year
            if dt.month >= 7:
                start = year
                end = year + 1
            else:
                start = year - 1
                end = year
            return f"{start}-{end}"

        def get_risk_category(total_sales: float) -> str:
            """Categorize risk based on total sales thresholds."""
            if total_sales < 152_000_000:
                return "< 152M"
            elif total_sales < 200_000_000:
                return "152M - 200M"
            elif total_sales < 400_000_000:
                return "200M - 400M"
            else:
                return ">= 400M"

        def process_and_export(df: pd.DataFrame, base_dir: str = "exports"):
            # Ensure RTN_FROM_DT is parsed to datetime
            df = df.copy()
            if 'RTN_FROM_DT' in df.columns:
                df['RTN_FROM_DT_dt'] = pd.to_datetime(df['RTN_FROM_DT'], dayfirst=True, errors='coerce')
            else:
                df['RTN_FROM_DT_dt'] = pd.NaT

            # Ensure TOTAL_SALES numeric
            if 'TOTAL_SALES' in df.columns:
                df['TOTAL_SALES'] = pd.to_numeric(df['TOTAL_SALES'], errors='coerce').fillna(0)
            else:
                df['TOTAL_SALES'] = 0

            # Assign financial year
            df['FINANCIAL_YEAR'] = df['RTN_FROM_DT_dt'].apply(lambda d: get_financial_year(d) if pd.notna(d) else 'unknown')

            base = Path(base_dir)
            base.mkdir(parents=True, exist_ok=True)

            summary_rows = []

            for fy in sorted(df['FINANCIAL_YEAR'].unique()):
                if fy == 'unknown':
                    continue
                fy_dir = base / fy
                fy_dir.mkdir(parents=True, exist_ok=True)

                df_fy = df[df['FINANCIAL_YEAR'] == fy]

                # Full year export with all TINs (CSV only)
                full_csv = fy_dir / f"full_year_all_tins_{fy}.csv"
                df_fy.to_csv(full_csv, index=False)

                # Half-year ranges
                start_year = int(fy.split('-')[0])
                # half1: 1 July start_year to 31 Dec start_year
                half1_start = datetime(start_year, 7, 1)
                half1_end = datetime(start_year, 12, 31)
                # half2: 1 Jan end_year to 30 Jun end_year
                end_year = int(fy.split('-')[1])
                half2_start = datetime(end_year, 1, 1)
                half2_end = datetime(end_year, 6, 30)

                df_half1 = df_fy[(df_fy['RTN_FROM_DT_dt'] >= half1_start) & (df_fy['RTN_FROM_DT_dt'] <= half1_end)]
                df_half2 = df_fy[(df_fy['RTN_FROM_DT_dt'] >= half2_start) & (df_fy['RTN_FROM_DT_dt'] <= half2_end)]

                # Export halves with all TINs (CSV only)
                h1_csv = fy_dir / f"half1_all_tins_{fy}_Jul-Dec.csv"
                df_half1.to_csv(h1_csv, index=False)

                h2_csv = fy_dir / f"half2_all_tins_{fy}_Jan-Jun.csv"
                df_half2.to_csv(h2_csv, index=False)

                # Build summary by TIN for this financial year using groupby (faster)
                group = df_fy.groupby('TIN_NO', as_index=False).agg({
                    'TAX_PAYER_ID': 'first',
                    'TAX_PAYER_NAME': 'first',
                    'REG_STATION': 'first',
                    'REGION_NAME': 'first',
                    'TOTAL_SALES': 'sum'
                })
                group['FINANCIAL_YEAR'] = fy
                group['RISK_CATEGORY'] = group['TOTAL_SALES'].apply(get_risk_category)

                # Extend summary_rows
                summary_rows.extend(group.to_dict('records'))

                print(f"Exported {fy}: full={len(df_fy)} rows, half1={len(df_half1)} rows, half2={len(df_half2)} rows, {len(df_fy['TIN_NO'].unique())} unique TINs")

            # Summary export - one file for all TINs across all financial years
            summary_df = pd.DataFrame(summary_rows)
            summary_csv = base / f"summary_all_tins.csv"
            # Write summary CSV safely
            try:
                summary_df.to_csv(summary_csv, index=False)
            except PermissionError:
                alt = base / f"summary_all_tins_{int(datetime.now().timestamp())}.csv"
                summary_df.to_csv(alt, index=False)
                summary_csv = alt

            print(f"\nSummary written to {summary_csv}")
            print(f"Total TINs processed: {summary_df['TIN_NO'].nunique()}")
            print(f"Financial years covered: {', '.join(sorted(summary_df['FINANCIAL_YEAR'].unique()))}")

        # Process all TINs and generate exports and summary
        print(f"\nProcessing {df['TIN_NO'].nunique()} unique TIN(s)...")
        process_and_export(df)