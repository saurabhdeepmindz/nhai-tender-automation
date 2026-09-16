# Build context is the python-rag/ directory (this service needs the sibling shared/ package)
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY shared/requirements.txt ./shared-requirements.txt
COPY screen08-chief-engineer/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt -r shared-requirements.txt

COPY shared ./shared
COPY screen08-chief-engineer ./screen08-chief-engineer

WORKDIR /app/screen08-chief-engineer
RUN mkdir -p query_db logs
ENV PYTHONUNBUFFERED=1
EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8001}/api/health || exit 1

CMD ["python", "main.py"]
