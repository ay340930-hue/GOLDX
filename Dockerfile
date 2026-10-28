# Multi-stage production container for GOLDX Backend & Analytics Engine
FROM python:3.13-slim

# Install Node.js 20 and system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python quantitative dependencies
COPY analytics/requirements.txt ./analytics/
RUN pip install --no-cache-dir -r ./analytics/requirements.txt

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy application source code and benchmark demo data
COPY analytics/ ./analytics/
COPY demo-data/ ./demo-data/
COPY backend/ ./backend/

# Set production environment defaults
ENV NODE_ENV=production \
    PORT=5000 \
    PYTHON_PATH=python3 \
    PYTHON_VERSION_ARG="" \
    PYTHON_PORT=5001

EXPOSE 5000

WORKDIR /app/backend
CMD ["node", "src/server.js"]
