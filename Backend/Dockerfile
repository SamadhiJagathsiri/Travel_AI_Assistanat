# Use a lightweight Python base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install CPU-only PyTorch first to reduce RAM footprint and container size
RUN pip install --no-cache-dir torch==2.13.0 --index-url https://download.pytorch.org/whl/cpu

# Install the rest of the backend requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose default port
EXPOSE 8080

# Run the application (shell form to support dynamic Railway $PORT mapping)
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
