# Build context is the python-rag/ directory (this service needs the sibling shared/ package)
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY shared/requirements.txt ./shared-requirements.txt
COPY screen07-history-retriever/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt -r shared-requirements.txt

COPY shared ./shared
COPY screen07-history-retriever ./screen07-history-retriever

WORKDIR /app/screen07-history-retriever
RUN mkdir -p chroma_db uploads logs
ENV PYTHONUNBUFFERED=1
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

CMD ["python", "main.py"]
