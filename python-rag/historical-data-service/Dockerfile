# Dockerfile for Python RAG Service
# rag_service/Dockerfile

FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for ChromaDB
RUN mkdir -p /app/chroma_db && chmod 755 /app/chroma_db

# Create directory for uploads
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

# Expose port
EXPOSE 8005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8005}/ || exit 1

# Run the application (main.py reads PORT env var itself, default 8005)
CMD ["python", "main.py"]
