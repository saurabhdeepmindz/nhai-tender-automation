# Build context is the python-rag/ directory (this service needs the sibling shared/ package)
FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY shared/requirements.txt ./shared-requirements.txt
COPY historical-data-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt -r shared-requirements.txt

COPY shared ./shared
COPY historical-data-service ./historical-data-service

WORKDIR /app/historical-data-service
RUN mkdir -p chroma_db uploads logs && chmod 755 chroma_db uploads logs

EXPOSE 8005

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8005}/ || exit 1

CMD ["python", "main.py"]
