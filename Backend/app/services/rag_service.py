from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from typing import List, Optional, Tuple
from pathlib import Path
from pypdf import PdfReader
import pickle
import logging

logger = logging.getLogger(__name__)

import faiss
import numpy as np

from app.services.embedding_service import embedding_service


class RAGService:
    def __init__(self):
        self.vector_store_path = Path("vector_store")
        self.missing_vector_store_message = (
            "No uploaded travel guides are available."
        )
        self.index = None
        self.documents: Optional[List[Document]] = None

    def extract_text(self, pdf_path: Path) -> str:
        reader = PdfReader(pdf_path)

        text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        return text

    def chunk_text(self, text: str, source: str = "unknown") -> List[Document]:
        if not text.strip():
            return []

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=[
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ]
        )

        chunks = splitter.split_text(text)

        return [
            Document(
                page_content=chunk,
                metadata={
                    "source": source,
                    "chunk": index
                }
            )
            for index, chunk in enumerate(chunks)
        ]

    def build_vector_store(self, documents: List[Document]) -> None:
        if not documents:
            raise ValueError("Cannot build vector store without documents.")

        documents = [
            document
            for document in documents
            if document.page_content and document.page_content.strip()
        ]

        if not documents:
            raise ValueError("Cannot build vector store from empty documents.")

        embeddings = embedding_service.create_embeddings(documents)

        embeddings = np.asarray(embeddings).astype("float32")

        if embeddings.size == 0 or embeddings.ndim != 2:
            raise ValueError("Embedding generation returned no vectors.")

        dimension = embeddings.shape[1]

        index = faiss.IndexFlatIP(dimension)

        index.add(embeddings)

        vector_store = Path("vector_store")
        vector_store.mkdir(exist_ok=True)

        faiss.write_index(
            index,
            str(vector_store / "faiss.index")
        )

        with open(vector_store / "metadata.pkl", "wb") as f:
            pickle.dump(documents, f)

        logger.info(f"Saved {len(documents)} documents.")

    def has_documents(self) -> bool:
        index_path = self.vector_store_path / "faiss.index"
        metadata_path = self.vector_store_path / "metadata.pkl"
        return index_path.exists() and metadata_path.exists()

    def list_uploaded_sources(self) -> List[str]:
        if not self.has_documents():
            return []

        try:
            _, documents = self.load_vector_store()
        except ValueError:
            return []

        sources = []
        seen = set()

        for document in documents:
            source = (document.metadata or {}).get("source")
            if source and source not in seen:
                seen.add(source)
                sources.append(source)

        return sources

    def process_document(self, pdf_path: Path):
        text = self.extract_text(pdf_path)

        if not text.strip():
            raise ValueError("No readable text was found in the PDF.")

        documents = self.chunk_text(
            text=text,
            source=pdf_path.name
        )

        if not documents:
            raise ValueError("No document chunks could be created from the PDF.")

        self.build_vector_store(documents)

        return documents

    def load_vector_store(self) -> Tuple[faiss.IndexFlatIP, List[Document]]:
        index_path = self.vector_store_path / "faiss.index"
        metadata_path = self.vector_store_path / "metadata.pkl"

        if not index_path.exists():
            raise ValueError(self.missing_vector_store_message)

        if not metadata_path.exists():
            raise ValueError(self.missing_vector_store_message)

        self.index = faiss.read_index(str(index_path))

        with open(metadata_path, "rb") as f:
            self.documents = pickle.load(f)

        if not self.documents:
            raise ValueError("Vector metadata does not contain any documents.")

        if self.index.ntotal == 0:
            raise ValueError("Vector index does not contain any embeddings.")

        return self.index, self.documents

    def embed_query(self, query: str) -> np.ndarray:
        return embedding_service.embed_query(query)

    def retrieve_with_scores(self, question: str, top_k: int = 5) -> List[Tuple[Document, float]]:
        if not question.strip():
            raise ValueError("Cannot retrieve documents for an empty question.")

        index, documents = self.load_vector_store()

        query_embedding = self.embed_query(question)

        query_embedding = np.expand_dims(
            query_embedding,
            axis=0
        ).astype("float32")

        scores, indices = index.search(
            query_embedding,
            min(top_k, len(documents))
        )

        results = []

        for idx, score in zip(indices[0], scores[0]):
            if idx != -1 and idx < len(documents):
                results.append((documents[idx], float(score)))

        return results

    def retrieve(self, question: str, top_k: int = 5) -> List[Document]:
        return [document for document, _ in self.retrieve_with_scores(question, top_k)]


rag_service = RAGService()
