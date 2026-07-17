from typing import List, Optional

import numpy as np
from langchain_core.documents import Document
from sentence_transformers import SentenceTransformer
from typing import List, Optional

import numpy as np
from langchain_core.documents import Document
from sentence_transformers import SentenceTransformer


class EmbeddingService:
    def __init__(self):
        self.model: Optional[SentenceTransformer] = None

    def _get_model(self) -> SentenceTransformer:
        if self.model is None:
            
            try:
                self.model = SentenceTransformer("BAAI/bge-small-en-v1.5", local_files_only=True)
            except Exception:
                self.model = SentenceTransformer("BAAI/bge-small-en-v1.5", local_files_only=False)

        return self.model

    def create_embeddings(self, documents: List[Document]) -> np.ndarray:
        """
        Generate vector embeddings for a list of LangChain Documents.
        """
        if not documents:
            return np.array([])

        texts = [
            doc.page_content.strip()
            for doc in documents
            if doc.page_content and doc.page_content.strip()
        ]

        if not texts:
            return np.array([])

        try:
            embeddings = self._get_model().encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
            )
            return embeddings
        except Exception as e:
            raise RuntimeError(f"Embedding generation failed: {e}") from e

    def embed_query(self, query: str) -> np.ndarray:
        if not query.strip():
            raise ValueError("Cannot embed an empty query.")

        try:
            embedding = self._get_model().encode(
                query.strip(),
                convert_to_numpy=True,
                normalize_embeddings=True,
            )

            return embedding.astype("float32")
        except Exception as e:
            raise RuntimeError(f"Query embedding failed: {e}") from e


embedding_service = EmbeddingService()
