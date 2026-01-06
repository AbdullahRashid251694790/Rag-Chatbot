"""
Python Embedding Service
========================
This service generates vector embeddings from text using sentence-transformers.
These embeddings are used for semantic search in the RAG system.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
import os
import time

# Initialize FastAPI app
app = FastAPI(
    title="Embedding API",
    description="Generate vector embeddings for text using sentence-transformers",
    version="1.0.0"
)

# Add CORS middleware to allow requests from SvelteKit
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the embedding model
# all-MiniLM-L6-v2 is a good balance of speed and quality
# It produces 384-dimensional embeddings
MODEL_NAME = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")
print(f"Loading model: {MODEL_NAME}...")
start_time = time.time()
model = SentenceTransformer(MODEL_NAME)
print(f"Model loaded in {time.time() - start_time:.2f} seconds")

# Get embedding dimension from the model
EMBEDDING_DIMENSION = model.get_sentence_embedding_dimension()
print(f"Embedding dimension: {EMBEDDING_DIMENSION}")


# Request/Response models
class EmbedRequest(BaseModel):
    """Request body for single text embedding"""
    text: str

class EmbedBatchRequest(BaseModel):
    """Request body for batch text embedding"""
    texts: list[str]

class EmbedResponse(BaseModel):
    """Response containing the embedding vector"""
    embedding: list[float]
    dimension: int

class EmbedBatchResponse(BaseModel):
    """Response containing multiple embedding vectors"""
    embeddings: list[list[float]]
    dimension: int
    count: int

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model: str
    dimension: int


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Embedding API",
        "version": "1.0.0",
        "model": MODEL_NAME,
        "dimension": EMBEDDING_DIMENSION,
        "endpoints": {
            "health": "/health",
            "embed_single": "POST /embed",
            "embed_batch": "POST /embed/batch"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Returns the status of the service and model information.
    """
    return HealthResponse(
        status="healthy",
        model=MODEL_NAME,
        dimension=EMBEDDING_DIMENSION
    )


@app.post("/embed", response_model=EmbedResponse, tags=["Embeddings"])
async def create_embedding(request: EmbedRequest):
    """
    Generate embedding for a single text.
    
    The embedding is a vector of floating-point numbers that represents
    the semantic meaning of the text. Similar texts will have similar embeddings.
    
    - **text**: The text to embed (max recommended length: 512 tokens)
    
    Returns a 384-dimensional vector for all-MiniLM-L6-v2 model.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        # Generate embedding
        # The model converts text to a dense vector representation
        embedding = model.encode(request.text, convert_to_numpy=True)
        
        # Convert numpy array to list for JSON serialization
        embedding_list = embedding.tolist()
        
        return EmbedResponse(
            embedding=embedding_list,
            dimension=len(embedding_list)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")


@app.post("/embed/batch", response_model=EmbedBatchResponse, tags=["Embeddings"])
async def create_embeddings_batch(request: EmbedBatchRequest):
    """
    Generate embeddings for multiple texts in a single request.
    
    This is more efficient than calling /embed multiple times
    because the model can process texts in batches.
    
    - **texts**: List of texts to embed (max recommended: 100 texts)
    
    Returns a list of 384-dimensional vectors.
    """
    if not request.texts or len(request.texts) == 0:
        raise HTTPException(status_code=400, detail="Texts list cannot be empty")
    
    if len(request.texts) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 texts per batch")
    
    # Filter out empty texts
    valid_texts = [t for t in request.texts if t and t.strip()]
    
    if len(valid_texts) == 0:
        raise HTTPException(status_code=400, detail="All texts are empty")
    
    try:
        # Generate embeddings for all texts at once
        embeddings = model.encode(valid_texts, convert_to_numpy=True)
        
        # Convert numpy arrays to lists
        embeddings_list = [emb.tolist() for emb in embeddings]
        
        return EmbedBatchResponse(
            embeddings=embeddings_list,
            dimension=EMBEDDING_DIMENSION,
            count=len(embeddings_list)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch embedding generation failed: {str(e)}")


@app.get("/model-info", tags=["Info"])
async def model_info():
    """Get detailed information about the loaded model"""
    return {
        "model_name": MODEL_NAME,
        "embedding_dimension": EMBEDDING_DIMENSION,
        "max_sequence_length": model.max_seq_length,
        "description": "Sentence transformer model for generating semantic embeddings"
    }


# Run with: uvicorn app.main:app --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)