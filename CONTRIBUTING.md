# Contributing to AI Flight Search

Thank you for contributing to the AI-powered flight search system! This document provides guidelines for development and collaboration.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Git
- OpenAI API Key
- Supabase Account

### Initial Setup
1. Clone the repository
2. Run `./setup.sh` to configure your environment
3. Add your API keys to `.env` files
4. Set up the database using Supabase migrations

## 🌟 Development Workflow

### Branch Strategy
We use a feature-branch workflow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/xxx` - Feature development branches
- `hotfix/xxx` - Critical bug fixes

### Creating a Feature
1. **Create a branch from develop:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Follow the existing code structure
   - Add tests if applicable
   - Update documentation

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: describe your feature
   
   More detailed description if needed.
   
   🤖 Generated with Claude Code
   
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

4. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub from feature branch to develop
   ```

### Commit Message Format
Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## 📁 Project Structure

```
ai-chat-to-search/
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions
│   ├── public/           # Static assets
│   └── package.json
├── backend/              # Next.js backend API
│   ├── src/
│   │   ├── app/api/      # API route handlers
│   │   ├── lib/          # Core libraries (chat-engine, etc.)
│   │   ├── models/       # Data models with Zod validation
│   │   └── services/     # External service integrations
│   ├── supabase/         # Database migrations and seeds
│   └── package.json
└── specs/                # Specifications and documentation
    └── 001-scoping-this-feature/
        ├── spec.md       # Feature specification
        ├── quickstart.md # Quick start guide
        └── contracts/    # API contracts
```

## 🔧 Code Standards

### TypeScript
- Use strict TypeScript configuration
- Define proper interfaces and types
- Use Zod for runtime validation

### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility best practices
- Use TypeScript for prop definitions

### API Development
- Use Zod for request/response validation
- Implement proper error handling
- Add comprehensive logging
- Follow RESTful conventions

### Database
- Write migrations for schema changes
- Use proper indexes for performance
- Follow naming conventions
- Add seed data for development

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Integration tests
npm run test:integration
```

### Test Coverage
- Aim for 80%+ test coverage
- Test critical user paths
- Mock external API calls
- Test error conditions

## 🚨 Security Guidelines

### Environment Variables
- **NEVER** commit `.env` files
- Use `.env.example` for documentation
- Rotate API keys regularly
- Use least-privilege access

### API Keys
- Store securely in environment variables
- Use different keys for different environments
- Monitor usage and set limits
- Never log or expose keys in responses

### Data Handling
- Validate all user inputs
- Sanitize data before database operations
- Use parameterized queries
- Implement rate limiting

## 📊 Performance Guidelines

### Frontend
- Optimize bundle size
- Use lazy loading for components
- Implement proper caching
- Minimize API calls

### Backend
- Use database indexes appropriately
- Implement response caching
- Monitor API response times
- Use connection pooling

### AI Integration
- Cache OpenAI responses when appropriate
- Implement request deduplication
- Monitor token usage
- Use streaming for better UX

## 🐛 Debugging

### Common Issues
1. **API Key Errors**: Check `.env` files
2. **Database Connection**: Verify Supabase credentials
3. **CORS Issues**: Check API URL configuration
4. **Build Errors**: Clear node_modules and reinstall

### Logging
- Use structured logging
- Include request IDs for tracing
- Log errors with full context
- Monitor performance metrics

## 📋 Code Review Checklist

Before submitting a PR:

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No sensitive data in commits
- [ ] API changes are backward compatible
- [ ] Performance impact is considered
- [ ] Security implications are reviewed

## 🚀 Deployment

### Staging
- Automatic deployment from `develop` branch
- Full integration testing environment
- Production-like data and configuration

### Production
- Manual deployment from `main` branch
- Requires approval from maintainers
- Automated rollback capabilities
- Zero-downtime deployment

## 📞 Support

- **Technical Questions**: Create an issue with the `question` label
- **Bug Reports**: Use the bug report template
- **Feature Requests**: Use the feature request template
- **Security Issues**: Email security@yourcompany.com

## 🙏 Recognition

Contributors will be acknowledged in:
- Release notes
- Contributors file
- Project documentation

Thank you for helping improve the AI Flight Search system!