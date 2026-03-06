# Claude Code Development Rules

## Project Structure

### Frontend Development
- **Location:** `src/` directory only
- **Tech Stack:** React + Vite + TypeScript
- **Deployment:** Vercel (deployed from repository root)
- **Rules:**
  - NEVER create or modify files in `frontend/` directory
  - All frontend changes must be in `src/`
  - Use TypeScript for type safety

### Backend Development
- **Location:** `backend/` directory only
- **Tech Stack:** FastAPI + SQLAlchemy + Python
- **Deployment:** Railway (deployed from `backend/` directory)
- **Rules:**
  - All backend changes must be in `backend/`
  - Use `requirements.txt` for dependencies
  - Use `Dockerfile` for deployment

## Prohibited Actions

1. ❌ **NEVER modify `frontend/` directory** - It is legacy code
2. ❌ **NEVER create new files in `frontend/`**
3. ❌ **NEVER read `frontend/` files for reference** (except for deletion)
4. ❌ **NEVER create `.DS_Store` files** (macOS metadata)

## Required Actions

1. ✅ All frontend work → `src/`
2. ✅ All backend work → `backend/`
3. ✅ Use `.gitignore` to exclude `.DS_Store`
4. ✅ Check `ARCHITECTURE.md` for deployment details

## Deployment Flow

- **Vercel** → Deploys repository root (which builds `src/`)
- **Railway** → Deploys `backend/` directory only

## File Search Patterns

When searching for code:
- ✅ Use `src/` for frontend
- ✅ Use `backend/` for backend
- ❌ Do NOT search `frontend/`

## Environment Variables

### Vercel (Frontend)
- `VITE_API_BASE_URL`: Backend API URL

### Railway (Backend)
- `DATABASE_URL`: PostgreSQL/MySQL connection string
- `GOOGLE_CLIENT_ID`: Google OAuth
- `GOOGLE_CLIENT_SECRET`: Google OAuth
- `GOOGLE_REDIRECT_URI`: Google OAuth
- `FRONTEND_URL`: Frontend URL for CORS
