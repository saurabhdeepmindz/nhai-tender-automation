"""
Migrate Screen07 ChromaDB (Instance #2) data to Instance #3 (Historical Data Service).

Source:
  - Instance #2: screen07-history-retriever/chroma_db
  - Collection: nhai_historical_data
Target:
  - Instance #3: historical-data-service/chroma_db
  - Collection: rfp_documents (default)

Usage:
  python migrate_screen7_to_instance3.py
  python migrate_screen7_to_instance3.py --type RFP
  python migrate_screen7_to_instance3.py --batch-size 200
"""

import argparse
import os
from typing import List, Dict, Any

import chromadb


def parse_args():
    parser = argparse.ArgumentParser(description="Migrate Screen07 ChromaDB data to Instance #3")
    parser.add_argument(
        "--source-dir",
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "chroma_db")),
        help="Path to Screen07 ChromaDB (Instance #2)",
    )
    parser.add_argument(
        "--target-dir",
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "historical-data-service", "chroma_db")),
        help="Path to Historical Data Service ChromaDB (Instance #3)",
    )
    parser.add_argument("--source-collection", default="nhai_historical_data")
    parser.add_argument("--target-collection", default="rfp_documents")
    parser.add_argument("--batch-size", type=int, default=500)
    parser.add_argument(
        "--type",
        dest="doc_type",
        default=None,
        help="Optional metadata.type filter (e.g., RFP, Q&A, CORRIGENDUM)",
    )
    return parser.parse_args()


def filter_batch(ids: List[str], docs: List[str], metas: List[Dict[str, Any]], embeds: List[List[float]], doc_type: str):
    if not doc_type:
        return ids, docs, metas, embeds

    f_ids, f_docs, f_metas, f_embeds = [], [], [], []
    for i, meta in enumerate(metas or []):
        if (meta or {}).get("type") == doc_type:
            f_ids.append(ids[i])
            f_docs.append(docs[i])
            f_metas.append(meta)
            f_embeds.append(embeds[i])
    return f_ids, f_docs, f_metas, f_embeds


def main():
    args = parse_args()

    print("=== ChromaDB Migration: Instance #2 -> Instance #3 ===")
    print(f"Source dir: {args.source_dir}")
    print(f"Target dir: {args.target_dir}")
    print(f"Source collection: {args.source_collection}")
    print(f"Target collection: {args.target_collection}")
    if args.doc_type:
        print(f"Filtering by metadata.type = {args.doc_type}")

    source_client = chromadb.PersistentClient(path=args.source_dir)
    target_client = chromadb.PersistentClient(path=args.target_dir)

    source_collection = source_client.get_or_create_collection(name=args.source_collection)
    target_collection = target_client.get_or_create_collection(
        name=args.target_collection,
        metadata={"description": "Migrated from Screen07 historical data"},
        embedding_function=None,
    )

    total = source_collection.count()
    print(f"Total source records: {total}")

    offset = 0
    migrated = 0

    while offset < total:
        batch = source_collection.get(
            limit=args.batch_size,
            offset=offset,
            include=["embeddings", "documents", "metadatas"],
        )

        ids = batch.get("ids", [])
        documents = batch.get("documents", [])
        metadatas = batch.get("metadatas", [])
        embeddings = batch.get("embeddings", [])

        if not ids:
            break

        ids, documents, metadatas, embeddings = filter_batch(
            ids, documents, metadatas, embeddings, args.doc_type
        )

        if ids:
            target_collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
                embeddings=embeddings,
            )
            migrated += len(ids)
            print(f"Migrated batch: {len(ids)} (offset {offset})")
        else:
            print(f"Skipped batch: 0 (offset {offset})")

        offset += args.batch_size

    print("=== Migration Complete ===")
    print(f"Migrated records: {migrated}")


if __name__ == "__main__":
    main()
