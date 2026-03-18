#!/bin/bash

echo "========================================"
echo "Video Summarizer - Quick Setup"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Edit .env file and add your API keys!"
    echo "Press Enter after editing .env..."
    read
fi

echo ""
echo "Starting Docker containers..."
docker-compose up --build
