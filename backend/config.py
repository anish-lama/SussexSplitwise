from pathlib import Path
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parents[1]  # backend/
ROOT_DIR = BASE_DIR.parent                      # project root

load_dotenv(ROOT_DIR / ".env", override=True)

def get_env(key):
    value = os.getenv(key)
    if value is None:
        raise ValueError(f"Missing environment variable: {key}")
    return value