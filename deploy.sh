#!/bin/bash
# Usage: ./deploy.sh YOUR_GCP_PROJECT_ID

PROJECT_ID=$1
REGION="us-central1"
BACKEND_SERVICE="lexguard-backend"
FRONTEND_SERVICE="lexguard-frontend"

if [ -z "$PROJECT_ID" ]; then
    echo "Usage: ./deploy.sh YOUR_GCP_PROJECT_ID"
    exit 1
fi

if [ -z "$GROQ_API_KEY" ]; then
    echo "Error: GROQ_API_KEY environment variable is not set."
    echo "Please run: export GROQ_API_KEY=your_key"
    exit 1
fi

echo "Deploying to project: $PROJECT_ID"

# Build and push backend
gcloud builds submit ./backend --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE
gcloud run deploy $BACKEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars GROQ_API_KEY=$GROQ_API_KEY \
  --memory 512Mi \
  --timeout 120

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)')
echo "Backend deployed at: $BACKEND_URL"

# Build and push frontend  
gcloud builds submit ./frontend \
  --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
  --build-arg VITE_API_URL=$BACKEND_URL
gcloud run deploy $FRONTEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 256Mi

echo "================================="
echo "Frontend URL:"
gcloud run services describe $FRONTEND_SERVICE --region $REGION --format 'value(status.url)'
