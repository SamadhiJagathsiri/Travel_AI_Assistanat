"""
Diagnostic script to investigate RAG retrieval issues.
Tests what chunks are retrieved for various queries and analyzes their relevance.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
import numpy as np
from app.services.rag_service import rag_service

load_dotenv()

def diagnose_retrieval(query: str, top_k: int = 10):
    """
    Retrieve chunks for a query and print diagnostic information.
    """
    print(f"\n{'='*80}")
    print(f"Query: '{query}'")
    print('='*80)
    
    try:
        # Load the vector store to get access to the index and similarity scores
        index, documents = rag_service.load_vector_store()
        
        if not documents:
            print("ERROR: No documents in vector store.")
            return
        
        print(f"Total documents in vector store: {len(documents)}\n")
        
        # Get query embedding
        query_embedding = rag_service.embed_query(query)
        query_embedding = np.expand_dims(query_embedding, axis=0).astype("float32")
        
        # Search with similarity scores
        scores, indices = index.search(query_embedding, min(top_k, len(documents)))
        
        print(f"Retrieved {len(indices[0])} chunks:\n")
        
        retrieved_chunks = []
        for rank, (score, idx) in enumerate(zip(scores[0], indices[0]), 1):
            if idx == -1 or idx >= len(documents):
                continue
            
            doc = documents[idx]
            metadata = doc.metadata or {}
            source = metadata.get("source", "unknown")
            chunk_num = metadata.get("chunk", "unknown")
            content = doc.page_content.strip()
            
            # Truncate for display
            content_preview = content[:200].replace("\n", " ")
            
            print(f"Rank {rank}:")
            print(f"  Chunk ID: {idx}")
            print(f"  Chunk Number: {chunk_num}")
            print(f"  Similarity Score: {score:.6f}")
            print(f"  Source: {source}")
            print(f"  Content Preview: {content_preview}...")
            print(f"  Content Length: {len(content)} chars")
            print()
            
            retrieved_chunks.append({
                'idx': idx,
                'chunk_num': chunk_num,
                'score': score,
                'source': source,
                'content': content
            })
        
        # Check for duplicates
        print("="*80)
        print("DUPLICATE ANALYSIS:")
        print("="*80)
        
        unique_contents = {}
        for chunk in retrieved_chunks:
            content_hash = hash(chunk['content'][:100])  # Hash first 100 chars
            if content_hash not in unique_contents:
                unique_contents[content_hash] = []
            unique_contents[content_hash].append(chunk['idx'])
        
        duplicates_found = False
        for content_hash, indices_list in unique_contents.items():
            if len(indices_list) > 1:
                duplicates_found = True
                print(f"Duplicate content in chunk indices: {indices_list}")
        
        if not duplicates_found:
            print("No duplicate content detected in retrieved chunks.")
        
        # Check for repeated context
        print("\n" + "="*80)
        print("REPEATED CONTEXT ANALYSIS:")
        print("="*80)
        
        # Look for highly similar content
        content_samples = [(c['idx'], c['content'][:500]) for c in retrieved_chunks]
        
        for i, (idx1, content1) in enumerate(content_samples):
            for idx2, content2 in content_samples[i+1:]:
                # Calculate simple overlap
                words1 = set(content1.lower().split())
                words2 = set(content2.lower().split())
                
                if len(words1) > 0 and len(words2) > 0:
                    overlap = len(words1 & words2) / max(len(words1), len(words2))
                    if overlap > 0.7:  # High overlap threshold
                        print(f"High overlap ({overlap:.2%}) between chunk {idx1} and chunk {idx2}")
        
        # Analyze query relevance
        print("\n" + "="*80)
        print("QUERY RELEVANCE ANALYSIS:")
        print("="*80)
        
        query_lower = query.lower()
        print(f"Query keywords: {query_lower}")
        print()
        
        for chunk in retrieved_chunks:
            content_lower = chunk['content'].lower()
            # Simple keyword matching
            keywords_present = []
            for keyword in query_lower.split():
                if keyword in content_lower:
                    keywords_present.append(keyword)
            
            match_percentage = (len(keywords_present) / len(query_lower.split())) * 100 if query_lower.split() else 0
            print(f"Chunk {chunk['idx']}: {match_percentage:.0f}% keyword match - Keywords found: {keywords_present}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Test queries
    test_queries = [
        "hi",
        "hello",
        "What are the best beaches in Sri Lanka?",
        "Do I need a visa?",
        "Tell me about Colombo",
    ]
    
    for query in test_queries:
        diagnose_retrieval(query, top_k=5)
