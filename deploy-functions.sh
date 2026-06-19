#!/bin/bash

# Deploy script for Supabase Edge Functions
# Usage: ./deploy-functions.sh

set -e

PROJECT_REF="gmttgnhhtueurxuwchob"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying Edge Functions..."
echo "📁 Project: $PROJECT_DIR"
echo "🔗 Project Ref: $PROJECT_REF"

cd "$PROJECT_DIR"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Link to project
echo "🔐 Linking to Supabase project..."
supabase link --project-ref "$PROJECT_REF" || true

# Deploy all functions
echo "📤 Deploying functions..."
supabase functions deploy

echo "✅ Deployment complete!"
echo "📊 Check status at: https://supabase.com/dashboard/project/$PROJECT_REF"
