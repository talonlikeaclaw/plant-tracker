# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PlantTracker is a web application for tracking plant care activities (watering, fertilizing, repotting). It's a monorepo with a Flask REST API backend (Python) and React SPA frontend (TypeScript).

## Development Commands

### Backend (Flask)

```bash
# From project root
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server (port 5000)
python run.py

# Database migrations
alembic upgrade head                    # Apply all migrations
alembic revision --autogenerate -m "description"  # Create new migration
alembic downgrade -1                    # Rollback one migration
```

### Frontend (React + Vite)

```bash
# From project root
cd frontend

# Install dependencies
npm install

# Run development server (hot reload)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Docker

```bash
# From project root
docker-compose up --build    # Build and run both services
docker-compose down          # Stop services
```

## Architecture

### Monorepo Structure

```
PlantTracker/
├── backend/        # Flask REST API (Python 3.11)
├── frontend/       # React SPA (TypeScript + Vite)
├── .env            # Environment variables (NOT committed)
└── docker-compose.yml
```

### Backend Architecture (Flask)

**Directory Layout:**
- `app/api/` - Flask blueprints (route handlers) organized by domain
- `app/models/` - SQLAlchemy ORM models + database.py (engine, Base)
- `app/services/` - Business logic layer (AuthService, UserService, etc.)
- `app/decorators/` - Custom decorators (JWT auth)
- `alembic/versions/` - Database migrations
- `config.py` - Loads .env into Flask config
- `run.py` - Entry point that creates app and tables

**Key Patterns:**
- Factory pattern: `create_app()` in `app/__init__.py`
- Service layer separates business logic from route handlers
- Blueprints registered with `/api` prefix (e.g., `/api/auth`, `/api/plants`)
- JWT authentication via Flask-JWT-Extended
- Database sessions created per-request with SQLAlchemy SessionLocal
- Tables auto-created on startup via `Base.metadata.create_all(bind=engine)`

**API Endpoints:**
- `/api/auth/` - POST register, login (returns JWT token)
- `/api/users/` - User management
- `/api/plants/` - Plant CRUD
- `/api/species/` - Plant species reference
- `/api/plant-care/` - Care activity logs
- `/api/care-types/` - Care types (system + user-created)

**Database Models:**
- User → Plants (one-to-many, cascade delete)
- User → CarePlans (one-to-many, cascade delete)
- User → CareTypes (one-to-many, cascade delete)
- Plant → CarePlans, PlantCare (history)

### Frontend Architecture (React)

**Directory Layout:**
- `src/api/` - HTTP client layer (axios instance + endpoint modules)
  - `axios.ts` - Axios instance with JWT interceptor
  - `auth.ts`, `dashboard.ts` - API endpoint functions
- `src/pages/` - Route components (Login, Register, Dashboard)
- `src/components/ui/` - shadcn/ui component library
- `src/types/` - TypeScript interfaces
- `src/lib/utils.ts` - Utility functions
- `App.tsx` - React Router setup
- `main.tsx` - Entry point

**Key Patterns:**
- JWT stored in localStorage, auto-injected via axios interceptor
- React Router for client-side routing (protected /dashboard route)
- Theme provider with dark mode support (localStorage key: "vite-ui-theme")
- shadcn/ui components styled with Tailwind CSS + CSS variables
- Type-safe API calls with TypeScript interfaces in `src/types/`

**Styling:**
- Tailwind CSS 4.1.11 with CSS variables in `index.css` (oklch color space)
- shadcn/ui component library (new-york style)
- Dark mode via `.dark` class
- Path alias: `@/` maps to `src/`

### Authentication Flow

1. User registers/logs in at `/api/auth/register` or `/api/auth/login`
2. Backend hashes password (Werkzeug PBKDF2), creates JWT token with user ID
3. Frontend stores token in localStorage
4. All requests include `Authorization: Bearer {token}` header (via axios interceptor)
5. Backend validates JWT before processing protected endpoints

### Environment Configuration

Required `.env` variables (at project root):
```
FLASK_ENV=development
SECRET_KEY=<flask_secret>
DB_NAME=plant_tracker
DB_USER=<postgres_user>
DB_PASSWORD=<postgres_password>
DB_HOST=<postgres_host>
DB_PORT=5432
JWT_SECRET_KEY=<jwt_secret>
VITE_API_URL=<backend_url>  # Frontend - points to /api
```

## Important Implementation Details

### Database Migrations
- Alembic manages migrations in `backend/alembic/versions/`
- Migrations are NOT automatically applied on startup
- Run `alembic upgrade head` manually after pulling new migrations
- Tables are auto-created via `Base.metadata.create_all()` in run.py, but use Alembic for schema changes

### CORS & API Communication
- Flask CORS enabled with `supports_credentials=True`
- Frontend must use `/api` prefix for all backend requests
- Axios instance in `frontend/src/api/axios.ts` handles base URL and auth

### Adding New Features

**Backend:**
1. Create SQLAlchemy model in `app/models/`
2. Create service class in `app/services/` for business logic
3. Create blueprint in `app/api/` with route handlers
4. Register blueprint in `app/api/__init__.py`
5. Generate migration: `alembic revision --autogenerate -m "description"`

**Frontend:**
1. Add TypeScript types to `src/types/index.ts`
2. Create API endpoint functions in `src/api/`
3. Create/update page component in `src/pages/`
4. Add route to `App.tsx` if needed
5. Use shadcn/ui components from `src/components/ui/`

### shadcn/ui Components
- Pre-installed components in `src/components/ui/`
- Configuration in `components.json` (new-york style, CSS variables)
- Add new components: Install via shadcn CLI (outside this codebase)
- All components use Tailwind classes + CSS variables for theming

### Current State
- Active branch: `feature/react-frontend` (theme mode improvements)
- Recent work: Theme mode toggle, CSS variable standardization, dark mode support
- Database service commented out in docker-compose.yml (uses local PostgreSQL)

## Tech Stack Summary

**Backend:** Flask 3.1.1, SQLAlchemy 2.0.41, PostgreSQL, Alembic, Flask-JWT-Extended, Flask-CORS

**Frontend:** React 19.1.1, TypeScript 5.8.3, Vite 7.0.6, Tailwind CSS 4.1.11, shadcn/ui, React Router 7.7.1, Axios 1.11.0

**Deployment:** Docker Compose (Flask on :5000, Nginx serving React on :3000)
