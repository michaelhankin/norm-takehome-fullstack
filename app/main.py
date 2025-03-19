from fastapi import FastAPI, Query
from .utils import DocumentService, QdrantService

app = FastAPI()
doc_service = DocumentService()
docs = doc_service.create_documents()
llm_service = QdrantService()
llm_service.connect()
llm_service.load(docs)

@app.get("/ask")
def ask(
    query: str = Query(...)
):
    output = llm_service.query(query)
    return output