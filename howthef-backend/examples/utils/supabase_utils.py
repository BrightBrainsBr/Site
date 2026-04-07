# supabase_util.py
import os

import requests
from dotenv import load_dotenv
from supabase._async.client import (
    AsyncClient,
    ClientOptions,
    create_client,
)

# supabase_utils.py
load_dotenv()
supabase: AsyncClient = None

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # For admin operations
SUPABASE_PROJECT_ID = os.getenv("SUPABASE_PROJECT_ID")


def set_supabase_client(client: AsyncClient):
    global supabase
    supabase = client
    print("Supabase client set in supabase_util:", supabase)  # For debugging


def get_supabase_client() -> AsyncClient:
    if supabase is None:
        raise Exception("Supabase client is not initialized")
    return supabase


def get_supabase_admin_client() -> AsyncClient:
    """Get Supabase client with service role key for admin operations like magic links"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise Exception("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set for admin operations")

    return create_client(
        SUPABASE_URL, SUPABASE_SERVICE_KEY, options=ClientOptions(auto_refresh_token=False, persist_session=False)
    )


def get_supabase_schema():
    url = f"{SUPABASE_URL}/rest/v1/projects/{SUPABASE_PROJECT_ID}/schemas/public"
    # headers = {"apikey": SUPABASE_KEY}
    headers = {"Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        schema = response.json()
        table_info = ""
        for table in schema["tables"]:
            table_name = table["name"]
            columns = [col["name"] for col in table["columns"]]
            table_info += f"Table: {table_name}\nColumns: {', '.join(columns)}\n\n"
        return table_info
    else:
        raise Exception(f"Failed to fetch Supabase schema: {response.status_code}")
