from ai_pipeline.azure_di import extract_receipt
from ai_pipeline.llm_fix import fix_with_llm
from datetime import datetime, date
import re

from datetime import datetime, date

def resolve_date(date_str):
    candidates = []

    for fmt in ("%m/%d/%y", "%d/%m/%y"):
        try:
            d = datetime.strptime(date_str, fmt).date()
            if 2022 <= d.year <= 2030:
                candidates.append(d)
        except:
            pass

    if not candidates:
        return None

    if len(candidates) == 1:
        return candidates[0]

    # pick closest to today
    today = date.today()
    return min(candidates, key=lambda d: abs((today - d).days))

def is_garbage_date(date):
    return (
        date.year < 2022 or
        date.year > 2030
    )

def extract_date_string(text):
    matches = re.findall(r"\b\d{2}/\d{2}/\d{2}\b", text)
    return matches


def process_receipt(file_path):
    
    data = extract_receipt(file_path)

    print("Raw Azure DI Data: ", data)

    if data.get("transaction_date") and is_garbage_date(data["transaction_date"]):
        print(" Bad Azure date detected, fixing from OCR...")

        date_strings = extract_date_string(data["raw_OCR_text"])

        if date_strings:
            fixed_date = resolve_date(date_strings[0])
            if fixed_date:
                data["transaction_date"] = fixed_date

    merchant = data.get("merchant")
    total = data.get("total")
    transaction_date = data.get("transaction_date")

    needs_fix = not (merchant and total and transaction_date)

    if needs_fix:
        print("Missing fields detected -> calling LLM..")
        data = fix_with_llm(data)
    else:
        print("All fields present -> skipping LLM")

    if data.get("transaction_date"):
        try:
            data["transaction_date"] = datetime.strptime(
                data["transaction_date"], "%Y-%m-%d"
            ).date()
        except Exception as e:
            print("Date conversion failed:", str(e))
    
    print("Final Processed Data: ", data)

    return data

