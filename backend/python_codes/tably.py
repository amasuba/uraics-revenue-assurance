import oracledb
import getpass
import csv
import os
import datetime
import re

def prompt_credentials():
    print("--- Oracle Database Login ---")
    db_user = input("Enter Username: ")
    db_password = getpass.getpass("Enter Password: ")
    # allow optional DSN override
    default_dsn = "exd02-c1-scan/ETAXDB"
    dsn = input(f"Enter DSN (host/service) [{default_dsn}]: ").strip() or default_dsn
    return {"user": db_user, "password": db_password, "dsn": dsn}


def _sanitize_ident(name: str) -> str:
    n = name.strip()
    # allow basic safe unquoted identifiers (letters, digits, underscore, dollar, #)
    if re.match(r'^[A-Za-z][A-Za-z0-9_$#]*$', n):
        return n.upper()
    # otherwise quote and escape
    return '"' + n.replace('"', '""') + '"'


def _sanitize_filename(name: str) -> str:
    # replace unsafe chars with underscore
    s = re.sub(r'[^A-Za-z0-9_-]+', '_', name)
    return s.strip('_')


def check_table_fields(conn_params, table_name):
    try:
        # Establish connection (Thin mode by default)
        with oracledb.connect(**conn_params) as connection:
            with connection.cursor() as cursor:
                # Querying ALL_TAB_COLUMNS for detailed metadata
                sql = """
                    SELECT column_name, data_type, data_length, nullable
                    FROM all_tab_columns
                    WHERE table_name = :tab_name
                    ORDER BY column_id
                """
                cursor.execute(sql, tab_name=table_name.upper())
                
                columns = cursor.fetchall()
                
                if not columns:
                    print(f"No fields found for table: {table_name}")
                    return

                print(f"{'COLUMN NAME':<25} {'TYPE':<15} {'LENGTH':<10} {'NULL?'}")
                print("-" * 60)
                for col in columns:
                    print(f"{col[0]:<25} {col[1]:<15} {col[2]:<10} {col[3]}")

                # Fetch first 10 rows and display as a table under the column headers
                table_ident = _sanitize_ident(table_name)
                # Get a random sample of up to 10 rows using DBMS_RANDOM
                sql_rows = f"SELECT * FROM (SELECT * FROM {table_ident} ORDER BY DBMS_RANDOM.VALUE) WHERE ROWNUM <= :lim"
                try:
                    cursor.execute(sql_rows, {"lim": 10})
                    rows = cursor.fetchall()
                    col_names = [d[0] for d in cursor.description] if cursor.description else []
                    if rows and col_names:
                        # compute widths
                        widths = [max(len(name), 12) for name in col_names]
                        for r in rows:
                            for i, val in enumerate(r):
                                widths[i] = max(widths[i], len(str(val)) if val is not None else 4)

                        header = ' | '.join(f"{col_names[i]:<{widths[i]}}" for i in range(len(col_names)))
                        print('\n' + header)
                        print('-' * len(header))
                        for r in rows:
                            row_str = ' | '.join(f"{str(r[i]) if r[i] is not None else 'NULL':<{widths[i]}}" for i in range(len(col_names)))
                            print(row_str)
                    else:
                        print('\n(no rows returned)')
                except oracledb.Error as e:
                    print(f"\nError fetching rows for preview: {e}")

                # Export up to 1000000000 sampled rows to CSV (table-named file)
                try:
                    export_limit = 1000000000
                    export_sql = f"SELECT * FROM (SELECT * FROM {table_ident} ORDER BY DBMS_RANDOM.VALUE) WHERE ROWNUM <= :lim"
                    cursor.execute(export_sql, {"lim": export_limit})
                    export_rows = cursor.fetchall()
                    export_col_names = [d[0] for d in cursor.description] if cursor.description else []
                    if export_rows and export_col_names:
                        out_dir = os.path.join(os.path.dirname(__file__), 'exports')
                        os.makedirs(out_dir, exist_ok=True)
                        fname = _sanitize_filename(table_name)
                        ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
                        out_path = os.path.join(out_dir, f"{fname}_{ts}.csv")
                        with open(out_path, 'w', newline='', encoding='utf-8') as csvf:
                            writer = csv.writer(csvf)
                            writer.writerow(export_col_names)
                            for row in export_rows:
                                writer.writerow([str(v) if v is not None else '' for v in row])
                        print(f"\nExported {len(export_rows)} sampled rows to {out_path}")
                    else:
                        print("\nNo rows available to export.")
                except Exception as e:
                    print(f"\nFailed to export sampled rows: {e}")

    except oracledb.Error as e:
        print(f"Oracle Error: {e}")

if __name__ == "__main__":
    conn_params = prompt_credentials()
    target_table = input("Enter table name to check: ")
    check_table_fields(conn_params, target_table)