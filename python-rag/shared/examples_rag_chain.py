"""Quick demo for RAGChain + RAGAS.

Usage:
  # In repo root
  # Optional: set OPENAI_API_KEY for RAGAS step
  python python-rag/shared/examples_rag_chain.py

What it does:
  1) Builds a RAGChain (Ollama-first, OpenAI fallback if needed).
  2) Indexes a tiny in-memory RFP document (chunk + embed + store in Chroma).
  3) Runs a semantic query and prints retrieved contexts.
  4) Runs a RAGAS evaluation on a dummy answer (if OPENAI_API_KEY is set).

Requirements:
  - ChromaDB Python package (already listed in shared/requirements.txt)
  - Ollama running locally for embeddings, OR OPENAI_API_KEY for fallback.
"""
from __future__ import annotations

import os
import sys

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Note: python-dotenv not installed. Set OPENAI_API_KEY manually or via environment.")

# Allow running as a script without installing the package
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON_RAG_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PYTHON_RAG_DIR not in sys.path:
    sys.path.append(PYTHON_RAG_DIR)

from shared.rag_chain import RAGChain, IngestDocument


def main() -> None:
    # 1) Init chain (Ollama-first). Fallback to OpenAI if Ollama unavailable.
    chain = RAGChain()

    # 2) Index a tiny sample document
    docs = [
        IngestDocument(
            document_id=1,
            rfp_number="RFP-001",
            title="Sample RFP",
            content=(
                "Clause A: Payment terms are NET 30. "
                "Clause B: Timelines require delivery within 45 days of PO." 
                "Clause C: Performance guarantees apply for 12 months."
            ),
            metadata={"source": "demo"},
        )
    ]
    chain.index_documents(docs)
    print("[OK] Indexed sample document into Chroma")

    # 3) Query with context
    query = "What are the payment terms and timelines?"
    result = chain.query_with_context(query, top_k=5)
    print("\n=== Retrieved Contexts ===")
    for i, ctx in enumerate(result["contexts"], start=1):
        print(f"[{i}] {ctx[:200]}...")

    # 4) Optional RAGAS evaluation (needs OPENAI_API_KEY)
    if os.getenv("OPENAI_API_KEY"):
        answer = "Payment is NET 30 and delivery must be within 45 days of PO."
        print("\n(Evaluating answer with RAGAS; this may take 10-30 seconds...)")
        try:
            scores = chain.evaluate_answer(query, answer, result["contexts"])
            print("\n=== RAGAS Scores ===")
            print(f"Faithfulness: {scores.get('faithfulness', 'N/A')}")
            print(f"Answer Relevancy: {scores.get('answer_relevancy', 'N/A')}")
            print(f"Evaluation Time: {scores.get('evaluation_time_ms', 'N/A')} ms")
            if scores.get('error'):
                print(f"Error: {scores['error']}")
        except Exception as e:
            print(f"RAGAS evaluation failed: {e}")
    else:
        print("\n(No OPENAI_API_KEY set; skipping RAGAS evaluation)")


if __name__ == "__main__":
    main()
