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
    return db_user, db_password


def list_accessible_objects(cursor):
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
    return cursor.fetchall()


def find_matching_objects(cursor, owner, table_pattern):
    # Validate pattern: allow alphanumerics, underscore, and % only
    pattern_raw = table_pattern.strip()
    if not pattern_raw:
        return []
    if not re.match(r'^[A-Za-z0-9_%]+$', pattern_raw):
        # fallback: sanitize and embed literal safely
        safe_pattern = pattern_raw.replace("'", "''").upper()
        if owner:
            safe_owner = owner.replace("'", "''").upper()
            sql = (
                "SELECT owner, table_name, 'TABLE' as type FROM all_tables "
                "WHERE upper(table_name) LIKE '" + safe_pattern + "' AND owner = '" + safe_owner + "' "
                "UNION ALL "
                "SELECT owner, view_name as table_name, 'VIEW' as type FROM all_views "
                "WHERE upper(view_name) LIKE '" + safe_pattern + "' AND owner = '" + safe_owner + "' "
                "ORDER BY owner, table_name"
            )
        else:
            sql = (
                "SELECT owner, table_name, 'TABLE' as type FROM all_tables "
                "WHERE upper(table_name) LIKE '" + safe_pattern + "' "
                "UNION ALL "
                "SELECT owner, view_name as table_name, 'VIEW' as type FROM all_views "
                "WHERE upper(view_name) LIKE '" + safe_pattern + "' "
                "ORDER BY owner, table_name"
            )
        cursor.execute(sql)
        return cursor.fetchall()

    # Safe pattern — use named binds
    pattern = pattern_raw.upper()
    params = {"pattern": pattern}
    sql = """
        SELECT owner, table_name, 'TABLE' as type
        FROM all_tables
        WHERE upper(table_name) LIKE :pattern
    """
    if owner:
        sql += " AND owner = :owner\n"
        params["owner"] = owner.upper()

    sql += "UNION ALL\n        SELECT owner, view_name as table_name, 'VIEW' as type\n        FROM all_views\n        WHERE upper(view_name) LIKE :pattern\n"
    if owner:
        sql += " AND owner = :owner\n"

    sql += "ORDER BY owner, table_name"

    cursor.execute(sql, params)
    return cursor.fetchall()


def get_column_summary(cursor, owner, table_name):
    sql = """
        SELECT column_name, data_type, data_length, data_precision, data_scale, nullable
        FROM all_tab_columns
        WHERE owner = :owner AND table_name = :table
        ORDER BY column_id
    """
    params = {"owner": owner.upper(), "table": table_name.upper()}
    cursor.execute(sql, params)
    cols = cursor.fetchall()
    summary = []
    for col_name, data_type, data_length, data_precision, data_scale, nullable in cols:
        if data_type in ("VARCHAR2", "CHAR", "NCHAR", "NVARCHAR2"):
            type_desc = f"{data_type}({data_length})"
        elif data_type in ("NUMBER",):
            if data_precision:
                if data_scale is not None:
                    type_desc = f"NUMBER({data_precision},{data_scale})"
                else:
                    type_desc = f"NUMBER({data_precision})"
            else:
                type_desc = "NUMBER"
        else:
            type_desc = data_type
        summary.append((col_name, type_desc, nullable))
    return summary


def preview_rows(cursor, owner, table_name, limit=10):
    # sanitize identifiers to avoid SQL injection or invalid names
    def _sanitize_ident(name: str) -> str:
        n = name.strip()
        # allow basic safe unquoted identifiers (letters, digits, underscore, dollar, #)
        if re.match(r'^[A-Z][A-Z0-9_$#]*$', n.upper()):
            return n.upper()
        # otherwise quote and escape
        return '"' + n.replace('"', '""') + '"'

    owner_uc = _sanitize_ident(owner)
    table_uc = _sanitize_ident(table_name)
    sql = f"SELECT * FROM {owner_uc}.{table_uc} WHERE ROWNUM <= :lim"
    try:
        # use named bind to avoid positional/positional-count issues
        cursor.execute(sql, {"lim": limit})
        rows = cursor.fetchall()
        cols = [d[0] for d in cursor.description] if cursor.description else []
        return cols, rows
    except oracledb.DatabaseError as e:
        # if database is read-only, raise a clearer error
        msg = str(e)
        if 'ORA-16000' in msg or 'read-only' in msg.lower():
            raise RuntimeError('Database is open READ ONLY; cannot select from this object') from e
        raise


def interactive_inspect(conn):
    with conn.cursor() as cursor:
        # Allow user to search for a table (supports % wildcard)
        owner = input("Enter owner/schema (press Enter to skip): ").strip()
        table_in = input("Enter table name or pattern (use % for wildcard): ").strip()
        if not table_in:
            print("Table pattern required. Exiting.")
            return

        try:
            matches = find_matching_objects(cursor, owner if owner else None, table_in)
        except Exception as e:
            msg = str(e)
            print(f"\nError searching for objects: {msg}")
            if 'ORA-01745' in msg or 'invalid host/bind variable name' in msg:
                print("\nHint: an invalid bind variable name was used in the query. Avoid numeric-leading or malformed bind names.")
            if 'ORA-16000' in msg or 'read-only' in msg.lower():
                print("\nHint: the target database is opened READ ONLY; consider using a writable pluggable DB or different credentials.")
            return
        if not matches:
            print("No matching tables/views found.")
            return

        if len(matches) > 1:
            print("Multiple matches found:")
            for i, (m_owner, m_name, m_type) in enumerate(matches, start=1):
                print(f"{i:3}: {m_owner:<20} {m_name:<35} {m_type}")
            choice = input("Enter number to inspect (or press Enter to cancel): ").strip()
            if not choice:
                print("Cancelled.")
                return
            try:
                idx = int(choice) - 1
                owner, table_name, obj_type = matches[idx]
            except Exception:
                print("Invalid choice.")
                return
        else:
            owner, table_name, obj_type = matches[0]

        print(f"\nInspecting {owner}.{table_name} ({obj_type})")

        # Column summary
        cols_summary = get_column_summary(cursor, owner, table_name)
        print(f"\n{'COLUMN':<35} {'TYPE':<20} {'NULLABLE'}")
        print('-' * 70)
        for col_name, type_desc, nullable in cols_summary:
            print(f"{col_name:<35} {type_desc:<20} {nullable}")

        # Preview rows
        try:
            col_names, rows = preview_rows(cursor, owner, table_name, limit=10)
        except Exception as e:
            msg = str(e)
            print(f"\nError previewing rows: {msg}")
            if 'ORA-01745' in msg or 'invalid host/bind variable name' in msg:
                print("\nHint: check column/table/owner names and bind variables used in queries.")
            if 'ORA-16000' in msg or 'read-only' in msg.lower():
                print("\nHint: database/pluggable DB is read-only; selecting may be restricted.")
            return

        print(f"\nFirst {min(10, len(rows))} rows (if any):")
        if not rows:
            print("(no rows)")
            return

        # Simple table print
        widths = [max(len(str(c)), 12) for c in col_names]
        for r in rows:
            for i, val in enumerate(r):
                widths[i] = max(widths[i], len(str(val)) if val is not None else 4)

        header = ' | '.join(f"{name:<{widths[i]}}" for i, name in enumerate(col_names))
        print(header)
        print('-' * len(header))
        for r in rows:
            row_str = ' | '.join(f"{str(val) if val is not None else 'NULL':<{widths[i]}}" for i, val in enumerate(r))
            print(row_str)

        # Export disabled: viewing only
        print("\nExport disabled — viewing only.")


def main():
    db_user, db_password = prompt_credentials()
    conn_params = {
        "user": db_user,
        "password": db_password,
        "dsn": "exd02-c1-scan:1521/ETAXDB"
    }
    try:
        with oracledb.connect(**conn_params) as conn:
            # Start interactive inspection
            interactive_inspect(conn)
    except oracledb.Error as e:
        print(f"\nOracle Error: {e}")


if __name__ == "__main__":
    main()
