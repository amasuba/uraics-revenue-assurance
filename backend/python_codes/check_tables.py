import oracledb
import getpass
import csv
import os
import datetime

def list_all_accessible_tables():
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
        # Establish connection
        with oracledb.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                # Query ALL_TABLES to see everything you have access to
                # Added 'ALL_VIEWS' to include 
                sql = """
                    SELECT owner, table_name, 'TABLE' as type 
                    FROM all_tables 
                    WHERE owner NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP')
                    UNION ALL
                    SELECT owner, view_name as table_name, 'VIEW' as type
                    FROM all_views
                    WHERE owner NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP')
                    ORDER BY owner, table_name
                """
                cursor.execute(sql)
                objects = cursor.fetchall()
                
                if not objects:
                    print("\nNo accessible tables or views found.")
                    return

                print(f"\n{'OWNER':<20} {'OBJECT NAME':<35} {'TYPE'}")
                print("-" * 65)
                for owner, name, obj_type in objects:
                    print(f"{owner:<20} {name:<35} {obj_type}")
                
                print(f"\nTotal objects found: {len(objects)}")

                # Export list of objects to CSV in exports/
                out_dir = os.path.join(os.path.dirname(__file__), 'exports')
                os.makedirs(out_dir, exist_ok=True)
                ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
                out_path = os.path.join(out_dir, f'accessible_objects_{ts}.csv')
                try:
                    with open(out_path, 'w', newline='', encoding='utf-8') as csvf:
                        writer = csv.writer(csvf)
                        writer.writerow(['owner', 'object_name', 'type'])
                        writer.writerows(objects)
                    print(f"\nExported object list to {out_path}")
                except Exception as e:
                    print(f"\nFailed to write CSV: {e}")
                    
    except oracledb.Error as e:
        print(f"\nOracle Error: {e}")

if __name__ == "__main__":
    list_all_accessible_tables()
