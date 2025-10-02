# AI-Powered Flight Search System

Natural language flight search using OpenAI to improve homepage conversion from 42%.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API Key
- Supabase Account

### Setup

1. **Run the setup script:**
```bash
./setup.sh
```

2. **Configure API Keys:**

Edit `backend/.env`:
```env
OPENAI_API_KEY=sk-...your-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. **Set up Database:**

In your Supabase SQL editor, run:
- `backend/supabase/migrations/001_initial_schema.sql`
- `backend/supabase/seeds/destination_recommendations.sql`

4. **Start the Application:**

Backend (Terminal 1):
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

Frontend (Terminal 2):
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## 🔑 Getting API Keys

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `backend/.env`

### Supabase
1. Create account at https://supabase.com
2. Create a new project
3. Go to Settings > API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - Anon/Public key → `SUPABASE_ANON_KEY`
   - Service Role key → `SUPABASE_SERVICE_KEY`

## 📝 Features

- **Natural Language Search**: "Flights to Tokyo next month for 2 people"
- **AI-Powered IATA Resolution**: Converts city names to airport codes
- **Smart Date Validation**: Ensures 14+ days ahead for Paylater
- **Multi-City Support**: Complex itineraries with multiple stops
- **Real-time Chat**: Streaming responses for better UX
- **Destination Recommendations**: Categorized travel suggestions

## 🧪 Testing

Test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

Test a conversation:
```bash
curl -X POST http://localhost:3001/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"initial_query": "Flights from NYC to Tokyo in April"}'
```

## 📚 Documentation

- [Quickstart Guide](specs/001-scoping-this-feature/quickstart.md)
- [API Documentation](specs/001-scoping-this-feature/contracts/openapi.yaml)
- [Development Guide](specs/001-scoping-this-feature/CLAUDE.md)

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, TypeScript
- **AI**: OpenAI GPT-4, AI SDK v5
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod

## 📁 Project Structure

```
ai-chat-to-search/
├── frontend/          # Next.js frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   └── types/       # TypeScript types
├── backend/           # Next.js backend
│   ├── src/
│   │   ├── app/api/     # API routes
│   │   ├── lib/         # Core libraries
│   │   ├── models/      # Data models
│   │   └── services/    # Services
│   └── supabase/       # Database files
└── specs/             # Specifications
```

## 🚨 Troubleshooting

### "API key not configured"
- Check your `.env` files have actual keys, not placeholder values
- Restart the development servers after adding keys

### "Database connection failed"
- Verify Supabase project is active
- Check credentials match your project
- Ensure migrations have been run

### "CORS errors"
- Frontend should use `http://localhost:3001/api`
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`

## 🤝 Support

For issues or questions:
- Check the [Quickstart Guide](specs/001-scoping-this-feature/quickstart.md)
- Review the [Development Guide](specs/001-scoping-this-feature/CLAUDE.md)
- Verify all API keys are correctly configured