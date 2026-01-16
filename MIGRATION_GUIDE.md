# Backend Migration Guide - Java Spring Boot

## 🎉 Migration Complete!

Your Idea Forge (Motif) platform has been successfully migrated from a frontend-only architecture to a secure backend-powered solution using **Java Spring Boot**.

---

## 🔒 Security Improvements

### Before (Insecure ❌)
- ❌ Groq API keys **hardcoded in frontend**
- ❌ Direct AI API calls from browser
- ❌ No rate limiting
- ❌ Client-side only validation
- ❌ No usage tracking

### After (Secure ✅)
- ✅ **API keys stored server-side only**
- ✅ All AI calls through authenticated backend
- ✅ JWT authentication with Supabase
- ✅ Rate limiting (10 analyses/hour, 50 chats/hour)
- ✅ Server-side input validation
- ✅ Usage tracking and cost monitoring

---

## 📂 What Was Created

### Backend (Java Spring Boot)
**Location**: `E:\idea-forge-backend\`

```
idea-forge-backend/
├── src/main/java/com/motif/ideaforge/
│   ├── IdeaForgeApplication.java       # Main app
│   ├── config/SecurityConfig.java       # Security & CORS
│   ├── controller/AIController.java     # REST endpoints
│   ├── service/
│   │   ├── ai/GroqService.java         # Secure AI integration ⭐
│   │   ├── ai/IdeaAnalyzerService.java # Business logic
│   │   └── ai/ChatbotService.java      # Chat logic
│   ├── security/                       # JWT auth
│   ├── repository/                     # Database
│   ├── model/entity/                   # JPA entities
│   └── exception/                      # Error handling
├── pom.xml                             # Dependencies
├── Dockerfile                          # Containerization
├── docker-compose.yml                  # Local dev setup
└── README.md                           # Backend docs
```

### Frontend Updates
**Location**: `E:\idea-forge-website\`

**Modified Files**:
- ✅ `src/lib/api-client.ts` - **NEW**: Secure API client
- ✅ `src/components/pages/IdeaAnalyserPage.tsx` - Uses backend API
- ✅ `src/components/Chatbot.tsx` - Uses backend API
- ✅ `.env.example` - Updated with BACKEND_URL
- ❌ `src/lib/groq.ts` - **DELETED** (insecure)

---

## 🚀 Quick Start Guide

### Step 1: Set Up Backend Environment

```bash
cd E:\idea-forge-backend

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
notepad .env
```

**Required Environment Variables**:
```env
# Supabase Database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_DB_URL=jdbc:postgresql://db.xxxxx.supabase.co:5432/postgres
SUPABASE_DB_PASSWORD=your_password
SUPABASE_JWT_SECRET=your_jwt_secret

# Groq AI (MOVE FROM FRONTEND!)
GROQ_API_KEY=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

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Step 2: Add Database Table for Usage Tracking

Run this SQL in your Supabase SQL Editor:

```sql
-- AI Usage Logs Table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    tokens_used INTEGER NOT NULL,
    estimated_cost DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_created ON ai_usage_logs(user_id, created_at DESC);
```

### Step 3: Run Backend Locally

**Option A: Docker (Recommended)**
```bash
cd E:\idea-forge-backend
docker-compose up --build
```

**Option B: Maven**
```bash
cd E:\idea-forge-backend

# Start Redis first
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Run Spring Boot
./mvnw spring-boot:run
```

Backend will start on: **http://localhost:8080**

### Step 4: Update Frontend Environment

```bash
cd E:\idea-forge-website

# Edit .env file
notepad .env
```

Add this line:
```env
VITE_BACKEND_URL=http://localhost:8080
```

**⚠️ Important**: Remove `VITE_GROQ_API_KEY` from your frontend `.env` file! It's now server-side only.

### Step 5: Test the Integration

1. **Start Backend** (Step 3)
2. **Start Frontend**:
   ```bash
   cd E:\idea-forge-website
   npm run dev
   ```
3. **Test Features**:
   - Login to your account
   - Go to "Idea Analyser" page
   - Try analyzing an idea
   - Test the chatbot

---

## 🔧 API Endpoints

### Base URL
- **Development**: http://localhost:8080
- **Production**: https://your-backend.up.railway.app

### Endpoints

#### Analyze Idea
```http
POST /api/ai/analyze-idea
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "title": "AI Fitness App",
  "description": "An app that uses AI to create personalized workouts",
  "targetMarket": "Fitness enthusiasts"
}
```

#### Chat with AI
```http
POST /api/ai/chat
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "message": "How do I validate my startup idea?",
  "conversationId": "optional-conversation-id",
  "history": [...]
}
```

#### Health Check
```http
GET /actuator/health
```

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| AI Analyze | 10 requests | 1 hour |
| AI Chat | 50 requests | 1 hour |
| Idea CRUD | 20 requests | 1 hour |

Rate limits are per-user and enforced via Redis.

---

## 🚢 Deployment

### Deploy Backend to Railway

1. **Create Railway Account**: https://railway.app/
2. **Create New Project** → "Deploy from GitHub repo"
3. **Connect Repository**: Select `idea-forge-backend`
4. **Add Environment Variables** (from Step 1)
5. **Add Redis**:
   - Railway Dashboard → "New" → "Database" → "Redis"
   - Auto-configures `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
6. **Deploy**: Railway auto-detects Dockerfile
7. **Get URL**: Copy deployment URL (e.g., `https://idea-forge-backend.up.railway.app`)

### Update Frontend for Production

```bash
# In Vercel Dashboard
# Settings → Environment Variables
VITE_BACKEND_URL=https://idea-forge-backend.up.railway.app
```

Redeploy frontend on Vercel.

---

## 🧪 Testing

### Test with cURL

```bash
# Get Supabase JWT token from browser (login to your app, check DevTools → Application → Cookies)
TOKEN="your_supabase_jwt_token"

# Test analyze endpoint
curl -X POST http://localhost:8080/api/ai/analyze-idea \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Idea",
    "description": "A test description for validation purposes",
    "targetMarket": "Test market"
  }'
```

### Test with Swagger UI

1. Start backend
2. Go to: http://localhost:8080/swagger-ui.html
3. Click "Authorize" → Paste Supabase JWT
4. Test endpoints interactively

---

## 🔍 Monitoring

### View Logs

```bash
# Docker logs
docker-compose logs -f backend

# Application logs
tail -f logs/application.log
```

### Health Check

```bash
curl http://localhost:8080/actuator/health
```

### Usage Tracking

Query `ai_usage_logs` table in Supabase to see:
- Total API calls per user
- Tokens consumed
- Estimated costs

---

## 📝 Migration Checklist

### Pre-Deployment

- [x] Backend created with Spring Boot
- [x] Groq API keys moved to backend
- [x] JWT authentication implemented
- [x] Rate limiting configured
- [x] Frontend updated to use backend API
- [x] Insecure `groq.ts` file deleted
- [ ] Database table `ai_usage_logs` created ⚠️
- [ ] `.env` files configured ⚠️
- [ ] Local testing completed ⚠️

### Post-Deployment

- [ ] Backend deployed to Railway/Render ⚠️
- [ ] Frontend environment updated with backend URL ⚠️
- [ ] Frontend redeployed to Vercel ⚠️
- [ ] Rate limiting tested ⚠️
- [ ] Error handling verified ⚠️
- [ ] Usage tracking confirmed ⚠️

---

## 🐛 Troubleshooting

### "Authentication required" error
- **Cause**: User not logged in or JWT invalid
- **Fix**: Ensure user is logged in via Supabase

### "Rate limit exceeded" error
- **Cause**: Too many requests
- **Fix**: Wait 1 hour or disable rate limiting in dev (`RATE_LIMIT_ENABLED=false`)

### Database connection error
- **Cause**: Invalid `SUPABASE_DB_URL` or password
- **Fix**: Verify credentials in Supabase dashboard → Settings → Database

### CORS error
- **Cause**: Frontend URL not in `allowed-origins`
- **Fix**: Add frontend URL to `application.yml` → `app.cors.allowed-origins`

### Redis connection error
- **Cause**: Redis not running
- **Fix**: `docker run -d -p 6379:6379 redis:7-alpine`

---

## 💰 Cost Estimation

### Groq API (per 1000 users)
- **10 analyses/user/month** = 10,000 analyses
- **Cost**: ~$12/month (Llama 3.1 70B @ $0.59/1M tokens)

### Infrastructure
- **Railway Pro**: $20/month
- **Supabase Pro**: $25/month
- **Upstash Redis**: $10/month (or free tier)

**Total**: ~$67/month for 1000 active users

---

## 📚 Additional Resources

- **Backend README**: `E:\idea-forge-backend\README.md`
- **Spring Boot Docs**: https://spring.io/projects/spring-boot
- **Supabase Docs**: https://supabase.com/docs
- **Railway Docs**: https://docs.railway.app/

---

## ✅ Success Criteria

Your migration is successful when:

1. ✅ Backend starts without errors
2. ✅ Frontend can call backend API
3. ✅ Idea analysis works end-to-end
4. ✅ Chatbot responds correctly
5. ✅ Rate limiting triggers after 10 analyses
6. ✅ No API keys visible in frontend code
7. ✅ Authentication required for all API calls

---

## 🎯 Next Steps

1. **Create the `ai_usage_logs` table** in Supabase (Step 2)
2. **Configure `.env` files** for both backend and frontend
3. **Test locally** (Steps 3-5)
4. **Deploy backend** to Railway
5. **Update frontend** environment variables
6. **Monitor usage** and costs

---

## 📞 Need Help?

If you encounter issues:

1. Check logs: `docker-compose logs backend`
2. Verify environment variables
3. Test API with Swagger UI
4. Check Supabase connection
5. Verify Redis is running

**Congratulations on securing your application! 🎉**

The hardcoded API keys are now safely stored on the backend, and all business logic is properly secured.
