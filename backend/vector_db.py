import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"
import chromadb
from chromadb.config import Settings
import uuid

# Ensure data is stored locally in the backend directory
CHROMA_DATA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db_data")
client = chromadb.PersistentClient(path=CHROMA_DATA_PATH, settings=Settings(anonymized_telemetry=False))
collection = client.get_or_create_collection(name="patient_reports")

def add_report(report_text: str, metadata: dict = None):
    """
    Adds a generated patient report to the ChromaDB vector store.
    """
    report_id = str(uuid.uuid4())
    collection.add(
        documents=[report_text],
        metadatas=[metadata or {}],
        ids=[report_id]
    )
    return report_id

def search_similar_reports(query_text: str, n_results: int = 3):
    """
    Searches for similar patient reports.
    """
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
    return results
