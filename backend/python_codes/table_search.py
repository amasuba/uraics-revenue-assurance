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



def list_accessible_objects(conn):
    # Exclude internal/system schemas that may not be readable
    excluded_owners = ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'XDB', 'APEX_', 'FLOWS_', 'MDSYS', 'CTXSYS', 'ORDDATA', 'SI_INFORMTN_SCHEMA', 'OLAPSYS', 'ORACLE_OCM')
    owner_list = ', '.join(f"'{o}'" for o in excluded_owners)
    sql = f"""
        SELECT owner, table_name, 'TABLE' as type
        FROM all_tables
        WHERE owner NOT IN ({owner_list})
        UNION ALL
        SELECT owner, view_name as table_name, 'VIEW' as type
        FROM all_views
        WHERE owner NOT IN ({owner_list})
        ORDER BY owner, table_name
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()


def process_all_tables(conn_params, preview_limit=10, export_limit=1000):
    results = []
    out_dir = os.path.join(os.path.dirname(__file__), 'exports')
    os.makedirs(out_dir, exist_ok=True)

    with oracledb.connect(**conn_params) as conn:
        tables = list_accessible_objects(conn)
        print(f"Found {len(tables)} objects to process.")
        for owner, table_name, obj_type in tables:
            row = {
                'owner': owner,
                'table': table_name,
                'type': obj_type,
                'preview_success': False,
                'preview_error': '',
                'export_success': False,
                'export_error': '',
                'rows_exported': 0,
                'csv_path': ''
            }
            qual_name = f"{owner}.{table_name}"
            print(f"\nProcessing {qual_name} ({obj_type})...")

            # Preview
            try:
                with conn.cursor() as cur:
                    table_ident = _sanitize_ident(qual_name)
                    preview_sql = f"SELECT * FROM (SELECT * FROM {table_ident} ORDER BY DBMS_RANDOM.VALUE) WHERE ROWNUM <= :lim"
                    cur.execute(preview_sql, {"lim": preview_limit})
                    preview_rows = cur.fetchall()
                    col_names = [d[0] for d in cur.description] if cur.description else []
                    row['preview_success'] = True
                    # print a small preview header
                    if preview_rows and col_names:
                        widths = [max(len(n), 12) for n in col_names]
                        for r in preview_rows:
                            for i, v in enumerate(r):
                                widths[i] = max(widths[i], len(str(v)) if v is not None else 4)
                        header = ' | '.join(f"{col_names[i]:<{widths[i]}}" for i in range(len(col_names)))
                        print(header)
                        print('-' * len(header))
                        for r in preview_rows:
                            print(' | '.join(f"{str(r[i]) if r[i] is not None else 'NULL':<{widths[i]}}" for i in range(len(col_names))))
                    else:
                        print("(no preview rows)")
            except Exception as e:
                row['preview_error'] = str(e)
                print(f"Error fetching rows for preview: {e}")

            # Export sampled rows up to export_limit
            try:
                with conn.cursor() as cur:
                    export_sql = f"SELECT * FROM (SELECT * FROM {table_ident} ORDER BY DBMS_RANDOM.VALUE) WHERE ROWNUM <= :lim"
                    cur.execute(export_sql, {"lim": export_limit})
                    export_rows = cur.fetchall()
                    export_col_names = [d[0] for d in cur.description] if cur.description else []
                    if export_rows and export_col_names:
                        fname = _sanitize_filename(f"{owner}_{table_name}")
                        ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
                        out_path = os.path.join(out_dir, f"{fname}_{ts}.csv")
                        with open(out_path, 'w', newline='', encoding='utf-8') as csvf:
                            writer = csv.writer(csvf)
                            writer.writerow(export_col_names)
                            for r in export_rows:
                                writer.writerow([str(v) if v is not None else '' for v in r])
                        row['export_success'] = True
                        row['rows_exported'] = len(export_rows)
                        row['csv_path'] = out_path
                        print(f"Exported {len(export_rows)} rows to {out_path}")
                    else:
                        print("No rows to export.")
            except Exception as e:
                row['export_error'] = str(e)
                print(f"Failed to export sampled rows: {e}")

            results.append(row)

    # Write report CSV
    report_path = os.path.join(out_dir, f"export_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
    with open(report_path, 'w', newline='', encoding='utf-8') as rf:
        writer = csv.writer(rf)
        writer.writerow(['owner', 'table', 'type', 'preview_success', 'preview_error', 'export_success', 'export_error', 'rows_exported', 'csv_path'])
        for r in results:
            writer.writerow([r['owner'], r['table'], r['type'], r['preview_success'], r['preview_error'], r['export_success'], r['export_error'], r['rows_exported'], r['csv_path']])

    # Print summary
    success_count = sum(1 for r in results if r['export_success'])
    failed_count = sum(1 for r in results if not r['export_success'])
    print(f"\n\n=== SUMMARY ===")
    print(f"Total objects processed: {len(results)}")
    print(f"Successful exports: {success_count}")
    print(f"Failed exports: {failed_count}")
    print(f"Report written to {report_path}")


if __name__ == "__main__":
    conn_params = prompt_credentials()
    process_all_tables(conn_params)