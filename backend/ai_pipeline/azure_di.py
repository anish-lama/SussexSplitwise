from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv
import os

load_dotenv()
endpoint = os.getenv("AzDI_ENDPOINT")
key = os.getenv("AzDI_key")

client = DocumentAnalysisClient(endpoint, AzureKeyCredential(key))

def extract_receipt(file_path):
    with open(file_path, "rb") as f:
        poller = client.begin_analyze_document(
            "prebuilt-receipt", document=f
        )
        result = poller.result()

    receipt_data = {}

    for doc in result.documents:
        merchant_field = doc.fields.get("MerchantName")
        total_field = doc.fields.get("Total")
        transaction_date_field = doc.fields.get("TransactionDate")

        receipt_data["merchant"] = merchant_field.value if merchant_field else None
        receipt_data["total"] = total_field.value if total_field else None
        receipt_data["transaction_date"] = transaction_date_field.value if transaction_date_field else None


        items = []

        if doc.fields.get("Items"):
            for item in doc.fields["Items"].value:

                desc = item.value.get("Description")
                price = item.value.get("TotalPrice")

                items.append({
                    "name": desc.value if desc else None,
                    "price": price.value if price else None
                })

        
        receipt_data["items"] = items
        receipt_data["raw_OCR_text"] = result.content
    return receipt_data
