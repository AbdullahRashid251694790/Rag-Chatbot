# Python Embedding Service Dockerfile
# ===================================
# This builds a container for the embedding API service

# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies required for sentence-transformers
# - build-essential: For compiling Python packages
# - curl: For health checks
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better Docker caching)
# If requirements don't change, Docker uses cached layer
COPY requirements.txt .

# Install Python dependencies
# --no-cache-dir reduces image size
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the model during build
# This makes container startup faster
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application code
COPY app/ ./app/

# Expose port 8000 for the API
EXPOSE 8000

# Command to run the application
# --host 0.0.0.0 makes it accessible from outside container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]