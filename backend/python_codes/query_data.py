import oracledb

conn_params = {
    "user": "op$audit",
    "password": "casemonitor2",
    "dsn": "exd02-c1-scan:1521/ETAXDB"
}

def fetch_sample_data(table_name):
    try:
        with oracledb.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                # Fetch first 5 rows
                sql = f"SELECT * FROM {table_name} FETCH FIRST 5 ROWS ONLY"
                cursor.execute(sql)
                
                # Print column headers
                columns = [col[0] for col in cursor.description]
                print(f"{' | '.join(columns)}")
                print("-" * 50)
                
                # Print rows
                for row in cursor:
                    print(row)
                    
    except oracledb.Error as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fetch_sample_data("VW2_VAT_DETAILS_IAC")
