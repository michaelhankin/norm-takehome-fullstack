from pydantic import BaseModel, Field
import qdrant_client
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.core.schema import Document
from llama_index.core import (
    VectorStoreIndex,
    Settings
)
from llama_index.core.node_parser import JSONNodeParser
from llama_index.core.query_engine import CitationQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.readers.file import PDFReader
from dataclasses import dataclass
import os
from pathlib import Path

key = os.environ['OPENAI_API_KEY']

@dataclass
class Input:
    query: str
    file_path: str

class Law(BaseModel):
    """
    A representation of a law, with its number, text, and subclauses.
    """
    
    number: str = Field(
        description="The number associated with the law (e.g. 1, 2.3, 1.1.2, 4.3.1.1, etc.)"
    )
    text: str = Field(description="The text of the law (e.g. 'Widows' or 'Trials of the Crown')")
    subclauses: list["Law"] = Field(
        description=("The subclauses of the law. This is based on how the laws are laid out in the source text "\
                     "(e.g. generally 1.1 is a subclause of 1, etc.)")
    )

class Laws(BaseModel):
    """
    Represents a list of top-level laws, with their nested laws linked as subclauses.
    """

    laws: list[Law] = Field(
        description="The list of top-level laws, with their nested laws linked as subclauses."
    )

class Citation(BaseModel):
    """
    Represents a citation of a law.
    """

    number: str = Field(
        description="The number of the law that's being cited (e.g. 1.1, 2.3.2, etc.)."
    )
    text: str = Field(
        description="The text of the law being cited."
    )

class Output(BaseModel):
    """
    The output to a query, including the laws that were cited.

    The citations should only appear in the 'citations' list, not inline in the 'response'.
    """

    query: str = Field(
        description="The input query."
    )
    response: str = Field(
        description="The response to the query."
    )
    citations: list[Citation] = Field(
        description="The list of laws that informed the response."
    )


class DocumentService:
    def create_documents(self) -> list[Document]:
        pdf_reader = PDFReader()
        pages = pdf_reader.load_data(file=Path("./docs/laws.pdf"))
        text = "\n".join([doc.text for doc in pages])
        sllm = OpenAI(model="gpt-4o").as_structured_llm(Laws)
        laws: Laws = sllm.complete(text).raw
        parsed_docs = [
            Document(
                text=law.model_dump_json()
            )
            for law in laws.laws
        ]
        return parsed_docs

class QdrantService:
    def __init__(self, k: int = 2):
        self.index = None
        self.k = k
        Settings.embed_model = OpenAIEmbedding()
        self.sllm = OpenAI(
            model="gpt-4o"
        ).as_structured_llm(Output)
    
    def connect(self) -> None:
        client = qdrant_client.QdrantClient(location=":memory:")
                
        vstore = QdrantVectorStore(client=client, collection_name='temp')

        self.index = VectorStoreIndex.from_vector_store(
            vector_store=vstore, 
        )

    def load(self, docs: list[Document]):
        parser = JSONNodeParser()
        nodes = parser.get_nodes_from_documents(docs)
        self.index.insert_nodes(nodes)
    
    def query(self, query_str: str) -> Output:
        retriever = VectorIndexRetriever(
            index=self.index,
            similarity_top_k=self.k
        )
        query_engine = CitationQueryEngine(
            retriever=retriever,
            llm=self.sllm
        )
        response = query_engine.query(query_str)
        output = response.response
        return output
       
