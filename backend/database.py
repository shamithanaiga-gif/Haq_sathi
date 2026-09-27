"""
Haq Saathi - Persistent Production Database Engine (SQLite3)
=============================================================
Provides robust, ACID-compliant persistent storage for:
- User accounts and profiles
- Submitted scheme applications (with reference IDs, status & details)
- Sovereign consent audit logs
- Active sessions

Features:
- Thread-safe connection handling
- Auto-seeding from existing JSON data on first boot
- Supports custom persistent volume paths (e.g. /data on Fly.io, persistent disk on Render)
- Automatic fallback to /tmp on serverless read-only filesystems (Vercel)
"""

import os
import sqlite3
import json
import time
import re
from typing import Dict, Any, List, Optional, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_db_path() -> str:
    """Resolves the persistent SQLite database path with robust multi-platform fallbacks."""
    custom_path = os.environ.get("DATABASE_PATH") or os.environ.get("HAQ_SAATHI_DB")
    if custom_path:
        os.makedirs(os.path.dirname(os.path.abspath(custom_path)), exist_ok=True)
        return os.path.abspath(custom_path)

    # 1. Fly.io or Docker persistent volume mount at /data
    if os.path.exists("/data") and os.path.isdir("/data"):
        try:
            test_file = "/data/.write_test"
            with open(test_file, "w") as f:
                f.write("1")
            os.remove(test_file)
            return "/data/haq_saathi.db"
        except (OSError, PermissionError):
            pass

    # 2. Local project data/ directory
    local_data_dir = os.path.join(BASE_DIR, "data")
    try:
        os.makedirs(local_data_dir, exist_ok=True)
        test_file = os.path.join(local_data_dir, ".write_test")
        with open(test_file, "w") as f:
            f.write("1")
        os.remove(test_file)
        return os.path.join(local_data_dir, "haq_saathi.db")
    except (OSError, PermissionError):
        # 3. Serverless / read-only filesystem (e.g. Vercel) fallback to /tmp
        tmp_dir = "/tmp/haq_saathi_data"
        os.makedirs(tmp_dir, exist_ok=True)
        return os.path.join(tmp_dir, "haq_saathi.db")


DB_PATH = get_db_path()


def get_connection() -> sqlite3.Connection:
    """Returns a SQLite connection configured for high concurrency and thread safety."""
    conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
    except Exception:
        pass
    return conn


def init_db():
    """Initializes tables and migrates seed data if tables are empty."""
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    phone TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    data TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    reference_id TEXT UNIQUE NOT NULL,
                    app_id TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    scheme_id TEXT NOT NULL,
                    scheme_title TEXT,
                    applicant_type TEXT DEFAULT 'self',
                    applicant_name TEXT DEFAULT 'Self',
                    status TEXT DEFAULT 'Submitted (Prototype)',
                    submitted_at TEXT NOT NULL,
                    details TEXT,
                    updated_at TEXT
                );
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_apps_phone ON applications(phone);
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_apps_ref ON applications(reference_id);
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    document_type TEXT,
                    scheme_id TEXT,
                    status TEXT,
                    data TEXT NOT NULL
                );
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    phone TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    expires_at REAL NOT NULL
                );
            """)
    finally:
        conn.close()

    # Seed data migration from existing JSON stores if database is fresh
    _seed_from_json_if_empty()


def _seed_from_json_if_empty():
    """Seeds the SQLite database from existing data/users_db.json and audit_log.json if empty."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users;")
        user_count = cursor.fetchone()[0]
        if user_count > 0:
            return  # Already seeded

        # 1. Seed users from data/users_db.json
        json_path = os.path.join(BASE_DIR, "data", "users_db.json")
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    users_data = json.load(f)
                with conn:
                    now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                    for phone, u in users_data.items():
                        apps = u.pop("applications", [])
                        name = u.get("name", "Beneficiary")
                        conn.execute(
                            "INSERT OR REPLACE INTO users (phone, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?);",
                            (phone, name, json.dumps(u, ensure_ascii=False), u.get("created_at", now_str), now_str)
                        )
                        # Seed applications
                        for a in apps:
                            ref_id = a.get("reference_id") or a.get("app_id") or f"REF-{phone[-4:]}"
                            app_id = a.get("app_id") or ref_id
                            conn.execute(
                                """
                                INSERT OR REPLACE INTO applications 
                                (reference_id, app_id, phone, scheme_id, scheme_title, applicant_type, applicant_name, status, submitted_at, details, updated_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                                """,
                                (
                                    ref_id,
                                    app_id,
                                    phone,
                                    a.get("scheme_id", "welfare_scheme"),
                                    a.get("scheme_title", "Welfare Scheme"),
                                    a.get("applicant_type", "self"),
                                    a.get("applicant_name", name),
                                    a.get("status", "Submitted (Prototype)"),
                                    a.get("submitted_at", now_str),
                                    json.dumps(a.get("details", {}), ensure_ascii=False),
                                    a.get("updated_at", now_str)
                                )
                            )
            except Exception as e:
                print(f"[DB Seed] Error seeding users from JSON: {e}")

        # 2. Seed audit log
        audit_path = os.path.join(BASE_DIR, "data", "audit_log.json")
        if os.path.exists(audit_path):
            try:
                with open(audit_path, "r", encoding="utf-8") as f:
                    logs = json.load(f)
                with conn:
                    for entry in logs:
                        entry_id = entry.get("id") or f"audit_{time.time()}"
                        user_id = entry.get("user_id") or "9876543210"
                        ts = entry.get("timestamp") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                        doc_type = entry.get("document_type", "unknown")
                        scheme_id = entry.get("scheme_id", "welfare")
                        status = entry.get("status", "ALLOWED")
                        conn.execute(
                            "INSERT OR IGNORE INTO audit_logs (id, user_id, timestamp, document_type, scheme_id, status, data) VALUES (?, ?, ?, ?, ?, ?, ?);",
                            (entry_id, user_id, ts, doc_type, scheme_id, status, json.dumps(entry, ensure_ascii=False))
                        )
            except Exception as e:
                print(f"[DB Seed] Error seeding audit logs: {e}")
    finally:
        conn.close()


# ==============================================================================
# Database Operations: Users
# ==============================================================================
def db_get_user(phone: str) -> Optional[Dict[str, Any]]:
    clean_p = re.sub(r'[\s\-\+]', '', str(phone or ''))
    if clean_p.startswith('91') and len(clean_p) == 12:
        clean_p = clean_p[2:]

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT data, created_at, updated_at FROM users WHERE phone = ?;", (clean_p,))
        row = cursor.fetchone()
        if not row:
            return None
        user_dict = json.loads(row["data"])
        user_dict["phone"] = clean_p
        user_dict["applications"] = db_get_user_applications(clean_p)
        return user_dict
    finally:
        conn.close()


def db_save_user(phone: str, user_dict: Dict[str, Any]) -> bool:
    clean_p = re.sub(r'[\s\-\+]', '', str(phone or ''))
    if clean_p.startswith('91') and len(clean_p) == 12:
        clean_p = clean_p[2:]

    name = user_dict.get("name", "Beneficiary")
    # Clone dict to avoid modifying in-place
    to_save = dict(user_dict)
    # Applications are stored in dedicated applications table
    to_save.pop("applications", None)

    now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    data_json = json.dumps(to_save, ensure_ascii=False)

    conn = get_connection()
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO users (phone, name, data, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(phone) DO UPDATE SET
                    name = excluded.name,
                    data = excluded.data,
                    updated_at = excluded.updated_at;
                """,
                (clean_p, name, data_json, to_save.get("created_at", now_str), now_str)
            )
        return True
    finally:
        conn.close()


def db_get_all_users() -> Dict[str, Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT phone, data FROM users;")
        rows = cursor.fetchall()
        result = {}
        for r in rows:
            u = json.loads(r["data"])
            u["phone"] = r["phone"]
            u["applications"] = db_get_user_applications(r["phone"])
            result[r["phone"]] = u
        return result
    finally:
        conn.close()


# ==============================================================================
# Database Operations: Applications
# ==============================================================================
def db_save_application(phone: str, app_data: Dict[str, Any]) -> Dict[str, Any]:
    clean_p = re.sub(r'[\s\-\+]', '', str(phone or ''))
    if clean_p.startswith('91') and len(clean_p) == 12:
        clean_p = clean_p[2:]

    ref_id = app_data.get("reference_id")
    app_id = app_data.get("app_id") or ref_id
    if not ref_id:
        app_clean = re.sub(r'[^A-Za-z0-9]', '', str(app_id or 'REF00000000'))
        ref_id = f"REF-{app_clean[-8:].upper()}"
        app_data["reference_id"] = ref_id

    scheme_id = app_data.get("scheme_id", "welfare_scheme")
    scheme_title = app_data.get("scheme_title", "Welfare Scheme")
    applicant_type = app_data.get("applicant_type", "self")
    applicant_name = app_data.get("applicant_name", "Self")
    status = app_data.get("status", "Submitted (Prototype)")
    submitted_at = app_data.get("submitted_at") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    details = app_data.get("details", {})
    now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    conn = get_connection()
    try:
        with conn:
            # Check existing application for idempotency
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, reference_id, app_id, submitted_at, status FROM applications 
                WHERE phone = ? AND (reference_id = ? OR app_id = ? OR (scheme_id = ? AND applicant_type = ? AND applicant_name = ?));
                """,
                (clean_p, ref_id, app_id, scheme_id, applicant_type, applicant_name)
            )
            existing = cursor.fetchone()

            if existing:
                existing_ref = existing["reference_id"]
                existing_app_id = existing["app_id"]
                conn.execute(
                    """
                    UPDATE applications SET
                        status = ?,
                        details = ?,
                        updated_at = ?
                    WHERE id = ?;
                    """,
                    (status, json.dumps(details, ensure_ascii=False), now_str, existing["id"])
                )
                app_data["reference_id"] = existing_ref
                app_data["app_id"] = existing_app_id
                app_data["submitted_at"] = existing["submitted_at"]
                app_data["status"] = status
                return {"success": True, "application": app_data, "reused": True}
            else:
                conn.execute(
                    """
                    INSERT INTO applications 
                    (reference_id, app_id, phone, scheme_id, scheme_title, applicant_type, applicant_name, status, submitted_at, details, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    (
                        ref_id,
                        app_id,
                        clean_p,
                        scheme_id,
                        scheme_title,
                        applicant_type,
                        applicant_name,
                        status,
                        submitted_at,
                        json.dumps(details, ensure_ascii=False),
                        now_str
                    )
                )
                return {"success": True, "application": app_data, "reused": False}
    finally:
        conn.close()


def db_get_user_applications(phone: str) -> List[Dict[str, Any]]:
    clean_p = re.sub(r'[\s\-\+]', '', str(phone or ''))
    if clean_p.startswith('91') and len(clean_p) == 12:
        clean_p = clean_p[2:]

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT reference_id, app_id, scheme_id, scheme_title, applicant_type, applicant_name, status, submitted_at, details, updated_at
            FROM applications 
            WHERE phone = ?
            ORDER BY id DESC;
            """,
            (clean_p,)
        )
        rows = cursor.fetchall()
        apps = []
        for r in rows:
            details_obj = json.loads(r["details"]) if r["details"] else {}
            app_dict = {
                "reference_id": r["reference_id"],
                "app_id": r["app_id"],
                "scheme_id": r["scheme_id"],
                "scheme_title": r["scheme_title"],
                "applicant_type": r["applicant_type"],
                "applicant_name": r["applicant_name"],
                "status": r["status"] or "Submitted (Prototype)",
                "application_status": r["status"] or "Submitted (Prototype)",
                "submitted_at": r["submitted_at"],
                "details": details_obj,
                "updated_at": r["updated_at"]
            }
            apps.append(app_dict)
        return apps
    finally:
        conn.close()


def db_update_application_status(phone: str, ref_or_app_id: str, new_status: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
    clean_p = re.sub(r'[\s\-\+]', '', str(phone or ''))
    if clean_p.startswith('91') and len(clean_p) == 12:
        clean_p = clean_p[2:]

    conn = get_connection()
    try:
        now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE applications SET
                    status = ?,
                    updated_at = ?
                WHERE phone = ? AND (reference_id = ? OR app_id = ?);
                """,
                (new_status, now_str, clean_p, ref_or_app_id, ref_or_app_id)
            )
            if cursor.rowcount == 0:
                return None

            cursor.execute(
                """
                SELECT reference_id, app_id, scheme_id, scheme_title, applicant_type, applicant_name, status, submitted_at, details, updated_at
                FROM applications 
                WHERE phone = ? AND (reference_id = ? OR app_id = ?);
                """,
                (clean_p, ref_or_app_id, ref_or_app_id)
            )
            r = cursor.fetchone()
            if not r:
                return None
            return {
                "reference_id": r["reference_id"],
                "app_id": r["app_id"],
                "scheme_id": r["scheme_id"],
                "scheme_title": r["scheme_title"],
                "status": r["status"],
                "submitted_at": r["submitted_at"],
                "details": json.loads(r["details"]) if r["details"] else {}
            }
    finally:
        conn.close()


# ==============================================================================
# Database Operations: Audit Logs
# ==============================================================================
def db_save_audit_log(entry: Dict[str, Any]) -> None:
    entry_id = entry.get("id") or f"audit_{time.time()}"
    user_id = entry.get("user_id") or "9876543210"
    ts = entry.get("timestamp") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    doc_type = entry.get("document_type", "unknown")
    scheme_id = entry.get("scheme_id", "welfare")
    status = entry.get("status", "ALLOWED")

    conn = get_connection()
    try:
        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO audit_logs (id, user_id, timestamp, document_type, scheme_id, status, data)
                VALUES (?, ?, ?, ?, ?, ?, ?);
                """,
                (entry_id, user_id, ts, doc_type, scheme_id, status, json.dumps(entry, ensure_ascii=False))
            )
    finally:
        conn.close()


def db_get_audit_logs(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if user_id:
            clean_id = re.sub(r'[\s\-\+]', '', str(user_id or ''))
            if clean_id.startswith('91') and len(clean_id) == 12:
                clean_id = clean_id[2:]
            cursor.execute("SELECT data FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC;", (clean_id,))
        else:
            cursor.execute("SELECT data FROM audit_logs ORDER BY timestamp DESC;")
        rows = cursor.fetchall()
        return [json.loads(r["data"]) for r in rows]
    finally:
        conn.close()


# Initialize database schema immediately on import
init_db()
