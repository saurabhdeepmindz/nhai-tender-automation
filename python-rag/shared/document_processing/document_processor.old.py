# rag_service/document_processor.py

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings, HuggingFaceEmbeddings
from langchain.document_loaders import PyPDFLoader, Docx2txtLoader
import pandas as pd
from typing import List, Dict, Optional
import os
import logging
import numpy as np

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """
    Process documents for text extraction and embedding generation
    Supports: PDF, DOCX, CSV (for Q&A)
    """

    def __init__(
        self,
        embedding_model: str = "openai",
        openai_api_key: Optional[str] = None,
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ):
        """
        Initialize document processor

        Args:
            embedding_model: "openai" or "local" (HuggingFace)
            openai_api_key: OpenAI API key (required if embedding_model="openai")
            chunk_size: Size of text chunks for processing
            chunk_overlap: Overlap between chunks
        """
        # Initialize embeddings model
        if embedding_model == "openai":
            if not openai_api_key:
                openai_api_key = os.getenv("OPENAI_API_KEY")
            self.embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
            logger.info("Using OpenAI embeddings")
        else:
            # Use local embeddings model (free, no API key needed)
            model_name = "sentence-transformers/all-mpnet-base-v2"
            self.embeddings = HuggingFaceEmbeddings(
                model_name=model_name,
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
            logger.info(f"Using local HuggingFace embeddings: {model_name}")

        # Text splitter for chunking large documents
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
        )

    async def process_rfp_document(
        self,
        file_path: str,
        document_id: int,
        rfp_number: str,
        title: str
    ) -> Dict:
        """
        Process RFP document (PDF or DOCX)

        Args:
            file_path: Path to the uploaded file
            document_id: Database document ID
            rfp_number: RFP identification number
            title: Document title

        Returns:
            Dict containing:
                - extracted_content: Full text
                - text_chunks: List of text chunks
                - chunk_embeddings: Embeddings for each chunk
                - document_embedding: Single embedding for entire document
                - metadata: Processing metadata
        """
        logger.info(f"Processing RFP document: {file_path}")

        # 1. Load document based on file type
        if file_path.endswith('.pdf'):
            loader = PyPDFLoader(file_path)
        elif file_path.endswith('.docx'):
            loader = Docx2txtLoader(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_path}")

        documents = loader.load()
        logger.info(f"Loaded {len(documents)} pages from document")

        # 2. Extract full text
        full_text = "\n\n".join([doc.page_content for doc in documents])
        logger.info(f"Extracted {len(full_text)} characters")

        # 3. Split into chunks for better semantic search
        text_chunks = self.text_splitter.split_text(full_text)
        logger.info(f"Split into {len(text_chunks)} chunks")

        # 4. Generate embeddings for each chunk
        chunk_embeddings = []
        for i, chunk in enumerate(text_chunks):
            try:
                embedding = self.embeddings.embed_query(chunk)
                chunk_embeddings.append({
                    'text': chunk,
                    'embedding': embedding,
                    'chunk_index': i
                })
            except Exception as e:
                logger.error(f"Error embedding chunk {i}: {str(e)}")
                continue

        logger.info(f"Generated embeddings for {len(chunk_embeddings)} chunks")

        # 5. Generate single embedding for full document (average of chunks)
        if chunk_embeddings:
            embeddings_array = np.array([ce['embedding'] for ce in chunk_embeddings])
            full_doc_embedding = np.mean(embeddings_array, axis=0).tolist()
        else:
            # Fallback: embed first 1000 chars
            full_doc_embedding = self.embeddings.embed_query(full_text[:1000])

        return {
            'extracted_content': full_text,
            'text_chunks': text_chunks,
            'chunk_embeddings': chunk_embeddings,
            'document_embedding': full_doc_embedding,
            'metadata': {
                'document_id': document_id,
                'rfp_number': rfp_number,
                'title': title,
                'num_pages': len(documents),
                'num_chunks': len(text_chunks),
                'content_length': len(full_text),
                'embedding_dimension': len(full_doc_embedding)
            }
        }

    async def process_qa_csv(
        self,
        file_path: str,
        document_id: int,
        rfp_number: str
    ) -> List[Dict]:
        """
        Process Q&A CSV file

        Expected CSV format:
        Query_ID, Category, Query, Response, Date

        Args:
            file_path: Path to CSV file
            document_id: Database document ID
            rfp_number: RFP identification number

        Returns:
            List of Q&A pairs with embeddings
        """
        logger.info(f"Processing Q&A CSV: {file_path}")

        # Read CSV file
        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            logger.error(f"Error reading CSV: {str(e)}")
            raise

        logger.info(f"Loaded {len(df)} Q&A pairs from CSV")

        qa_pairs = []

        for idx, row in df.iterrows():
            try:
                query = str(row.get('Query', '')).strip()
                response = str(row.get('Response', '')).strip()
                category = str(row.get('Category', 'General')).strip()
                query_id = str(row.get('Query_ID', f'Q{idx:03d}')).strip()
                date = str(row.get('Date', '')).strip()

                # Skip empty rows
                if not query or not response:
                    logger.warning(f"Skipping row {idx}: empty query or response")
                    continue

                # Generate embedding for the query
                query_embedding = self.embeddings.embed_query(query)

                # Also embed the response
                response_embedding = self.embeddings.embed_query(response)

                # Create combined embedding (weighted average: 70% query, 30% response)
                # This helps match based on both question and answer content
                combined_embedding = (
                    0.7 * np.array(query_embedding) +
                    0.3 * np.array(response_embedding)
                ).tolist()

                qa_pairs.append({
                    'query_id': query_id,
                    'query': query,
                    'response': response,
                    'category': category,
                    'date': date,
                    'query_embedding': query_embedding,
                    'response_embedding': response_embedding,
                    'combined_embedding': combined_embedding,
                    'metadata': {
                        'document_id': document_id,
                        'rfp_number': rfp_number,
                        'category': category,
                        'query_id': query_id,
                        'date': date
                    }
                })

            except Exception as e:
                logger.error(f"Error processing Q&A row {idx}: {str(e)}")
                continue

        logger.info(f"Successfully processed {len(qa_pairs)} Q&A pairs")

        return qa_pairs

    async def process_corrigendum(
        self,
        file_path: str,
        document_id: int,
        rfp_number: str,
        title: str
    ) -> Dict:
        """
        Process corrigendum document

        Similar to RFP processing but optimized for shorter documents

        Args:
            file_path: Path to corrigendum file
            document_id: Database document ID
            rfp_number: RFP identification number
            title: Document title

        Returns:
            Dict with extracted content and embeddings
        """
        logger.info(f"Processing corrigendum: {file_path}")

        # Process similar to RFP
        result = await self.process_rfp_document(
            file_path, document_id, rfp_number, title
        )

        # Add corrigendum-specific metadata
        result['metadata']['document_type'] = 'CORRIGENDUM'

        return result

    def extract_text_from_pdf(self, file_path: str) -> str:
        """
        Simple text extraction from PDF

        Args:
            file_path: Path to PDF file

        Returns:
            str: Extracted text
        """
        try:
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            text = "\n\n".join([doc.page_content for doc in documents])
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise

    def extract_text_from_docx(self, file_path: str) -> str:
        """
        Simple text extraction from DOCX

        Args:
            file_path: Path to DOCX file

        Returns:
            str: Extracted text
        """
        try:
            loader = Docx2txtLoader(file_path)
            documents = loader.load()
            text = "\n\n".join([doc.page_content for doc in documents])
            return text
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {str(e)}")
            raise

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for given text

        Args:
            text: Input text

        Returns:
            List[float]: Embedding vector
        """
        try:
            embedding = self.embeddings.embed_query(text)
            return embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise

    def calculate_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float]
    ) -> float:
        """
        Calculate cosine similarity between two embeddings

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            float: Similarity score (0-1)
        """
        # Convert to numpy arrays
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)

        # Calculate cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        similarity = dot_product / (norm1 * norm2)

        # Ensure result is between 0 and 1
        return max(0.0, min(1.0, similarity))
