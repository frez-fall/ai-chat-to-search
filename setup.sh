#!/bin/bash

# AI Flight Search Setup Script
echo "🚀 AI Flight Search - Setup Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend/.env file from template...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Created backend/.env${NC}"
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

# Check for required environment variables
echo ""
echo "📋 Checking API Keys Configuration..."
echo ""

# Function to check env variable
check_env_var() {
    local file=$1
    local var=$2
    local description=$3
    
    if grep -q "^${var}=your_" "$file" || grep -q "^${var}=$" "$file"; then
        echo -e "${RED}❌ ${description} not configured${NC}"
        echo "   Please add your ${var} to ${file}"
        return 1
    else
        echo -e "${GREEN}✅ ${description} configured${NC}"
        return 0
    fi
}

# Check backend environment variables
echo "Backend Configuration (backend/.env):"
check_env_var "backend/.env" "OPENAI_API_KEY" "OpenAI API Key"
OPENAI_OK=$?

check_env_var "backend/.env" "SUPABASE_URL" "Supabase URL"
SUPABASE_URL_OK=$?

check_env_var "backend/.env" "SUPABASE_ANON_KEY" "Supabase Anon Key"
SUPABASE_ANON_OK=$?

check_env_var "backend/.env" "SUPABASE_SERVICE_KEY" "Supabase Service Key"
SUPABASE_SERVICE_OK=$?

# Check frontend environment variables
echo ""
echo "Frontend Configuration (frontend/.env.local):"
check_env_var "frontend/.env.local" "NEXT_PUBLIC_SUPABASE_URL" "Supabase URL"
FRONTEND_SUPABASE_URL_OK=$?

check_env_var "frontend/.env.local" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase Anon Key"
FRONTEND_SUPABASE_ANON_OK=$?

# Install dependencies
echo ""
echo "📦 Installing Dependencies..."
echo ""

# Backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Database setup instructions
echo ""
echo "🗄️  Database Setup Instructions:"
echo "================================"

if [ $SUPABASE_URL_OK -eq 0 ] && [ $SUPABASE_SERVICE_OK -eq 0 ]; then
    echo -e "${GREEN}✅ Supabase is configured!${NC}"
    echo ""
    echo "To set up your database:"
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Run the migration script: backend/supabase/migrations/001_initial_schema.sql"
    echo "4. Run the seed data script: backend/supabase/seeds/destination_recommendations.sql"
else
    echo -e "${YELLOW}⚠️  Please configure Supabase first:${NC}"
    echo ""
    echo "1. Create a Supabase account at https://supabase.com"
    echo "2. Create a new project"
    echo "3. Get your project URL and keys from Settings > API"
    echo "4. Add them to backend/.env and frontend/.env.local"
    echo "5. Run this setup script again"
fi

# OpenAI setup instructions
echo ""
echo "🤖 OpenAI Setup Instructions:"
echo "============================="

if [ $OPENAI_OK -eq 0 ]; then
    echo -e "${GREEN}✅ OpenAI API Key is configured!${NC}"
else
    echo -e "${YELLOW}⚠️  Please configure OpenAI:${NC}"
    echo ""
    echo "1. Get your API key from https://platform.openai.com/api-keys"
    echo "2. Add it to backend/.env as OPENAI_API_KEY"
    echo "3. Run this setup script again"
fi

# Start instructions
echo ""
echo "🚀 Starting the Application:"
echo "============================"

ALL_OK=0
if [ $OPENAI_OK -eq 0 ] && [ $SUPABASE_URL_OK -eq 0 ] && [ $SUPABASE_SERVICE_OK -eq 0 ]; then
    echo -e "${GREEN}All required API keys are configured!${NC}"
    echo ""
    echo "To start the application:"
    echo "1. Backend:  cd backend && npm run dev"
    echo "2. Frontend: cd frontend && npm run dev"
    echo ""
    echo "The app will be available at:"
    echo "- Frontend: http://localhost:3000"
    echo "- Backend API: http://localhost:3001"
    echo ""
    echo "Test the health endpoint:"
    echo "curl http://localhost:3001/api/health"
else
    echo -e "${YELLOW}⚠️  Please configure all required API keys first${NC}"
    echo "See the instructions above for missing configurations."
fi

echo ""
echo "📚 Documentation:"
echo "================"
echo "- Quickstart Guide: specs/001-scoping-this-feature/quickstart.md"
echo "- API Documentation: specs/001-scoping-this-feature/contracts/openapi.yaml"
echo "- Development Guide: specs/001-scoping-this-feature/CLAUDE.md"

echo ""
echo "✨ Setup check complete!"