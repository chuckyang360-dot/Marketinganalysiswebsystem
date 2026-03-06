# Architecture

## Production Structure

```
Vibe Marketing/
├── src/                    # Production Frontend (Vercel)
│   └── app/               # React Application
├── backend/                # Production Backend (Railway)
│   └── app/               # FastAPI Application
├── frontend/               # DEPRECATED - Legacy frontend, DO NOT USE
└── .gitignore
```

## Deployment

### Frontend (Vercel)
- **Source:** Repository Root
- **Build Directory:** Not configured (uses root)
- **Build Command:** `npm run build`
- **Output:** `dist/`

### Backend (Railway)
- **Source:** `backend/` directory
- **Build Command:** `docker build .`
- **Port:** 8000

## Environment Variables

### Vercel (Frontend)
- `VITE_API_BASE_URL`: Backend API URL

### Railway (Backend)
- `DATABASE_URL`: Database connection string
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- `GOOGLE_REDIRECT_URI`: Google OAuth Redirect URI
- `FRONTEND_URL`: Frontend URL for CORS

## Important Notes

- **DO NOT modify** the `frontend/` directory - it is legacy code
- All frontend development must be in `src/`
- All backend development must be in `backend/`
