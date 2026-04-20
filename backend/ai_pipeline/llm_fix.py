import os
import json
from dotenv import load_dotenv
from openai import AzureOpenAI
from pathlib import Path


project_root = Path(__file__).resolve().parents[2]
dotenv_path = project_root / ".env"
load_dotenv(dotenv_path, override=True)

client = AzureOpenAI(
    api_key=os.getenv("LLM_API_KEY"),
    azure_endpoint=os.getenv("LLM_ENDPOINT"),
    api_version="2024-02-15-preview"
)

DEPLOYMENT_NAME = os.getenv("DEPLOYMENT_NAME")

def fix_with_llm(data):
    prompt = f"""
You are given structured receipt data and raw OCR text.

Your job:
-Fill ONLY missing fields: merchant, total, transaction_date
-Use raw_OCR_text to find missing values
-If total is missing, you MAY calculate from items including GST and PST
-DO NOT change existing correct values
-DO NOT hallucinate values
-Keep EXACT same JSON structure

Structured Data:
{json.dumps(data, indent=2, default=str)}

Raw OCR Text:
{data.get("raw_OCR_text")}

Return Only valid JSON.json. No explanation.
"""
    
    try:
        response = client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": "You are precise receipt data fixer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )

        content = response.choices[0].message.content

        content = content.strip().replace("```json", "").replace("```", "")

        fixed = json.loads(content)

        return fixed
    except Exception as e:
        print("LLM Fix Error:", str(e))
        return data
    