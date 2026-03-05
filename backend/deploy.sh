#!/bin/bash

# 构建并启动 Docker 容器
echo "Building Docker image..."
docker build -t vibe-marketing-backend .

echo "Starting containers..."
docker-compose up -d

echo "Deployment complete!"
echo "API will be available at: http://localhost:8000"
echo "API docs at: http://localhost:8000/docs"