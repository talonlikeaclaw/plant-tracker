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
- `/api/users/` - User management (GET current user info, PATCH update user, PATCH /password for password change)
- `/api/plants/` - Plant CRUD (create, read, update, delete)
- `/api/species/` - Plant species reference (crowdsourced database)
- `/api/plant-care/` - Care activity logs CRUD
- `/api/care-plans/` - Care plan scheduling (create, read, update, delete, active/inactive)
- `/api/care-types/` - Care types (system defaults + user-created custom types with edit/delete)
- `/api/dashboard/` - Dashboard data (user plants, upcoming care logs, past care logs)

**Database Models:**
- User → Plants (one-to-many, cascade delete)
- User → CarePlans (one-to-many, cascade delete)
- User → CareTypes (one-to-many, cascade delete)
- Plant → CarePlans, PlantCare (history)

### Frontend Architecture (React)

**Directory Layout:**
- `src/api/` - HTTP client layer (axios instance + endpoint modules)
  - `axios.ts` - Axios instance with JWT interceptor and 401 response handler
  - `auth.ts` - Login and registration endpoints
  - `users.ts` - Get current user, change password
  - `dashboard.ts`, `plants.ts`, `species.ts`, `careLogs.ts`, `carePlans.ts`, `careTypes.ts` - API endpoint functions
- `src/pages/` - Route components
  - Authentication: `Login.tsx`, `Register.tsx`
  - Dashboard: `Dashboard.tsx`
  - Account: `Settings.tsx`
  - Plants: `ViewPlants.tsx`, `AddPlant.tsx`
  - Species: `Species.tsx`
  - Care Plans: `CarePlans.tsx`, `AddCarePlan.tsx`
  - Care: `LogCare.tsx`, `CareTypes.tsx`
- `src/components/` - Reusable components
  - `ui/` - shadcn/ui component library
  - `mode-toggle.tsx` - Theme toggle component
  - `user-menu.tsx` - User account dropdown menu (logout, settings)
  - `theme-provider.tsx` - Theme context provider
- `src/types/` - TypeScript interfaces (Plant, Species, CareLog, CarePlan, CareType, UpcomingCareLog)
- `src/lib/utils.ts` - Utility functions
- `App.tsx` - React Router setup with protected routes
- `main.tsx` - Entry point

**Key Patterns:**
- JWT stored in localStorage, auto-injected via axios interceptor
- React Router for client-side routing with protected routes (redirect to /login if not authenticated)
- Theme provider with dark mode support (localStorage key: "vite-ui-theme")
- shadcn/ui components styled with Tailwind CSS + CSS variables
- Type-safe API calls with TypeScript interfaces in `src/types/`
- Dialog modals for confirmations, inline forms, and destructive actions
- Success/error alert display at page level with auto-clear patterns
- Loading states for async operations with disabled buttons
- Auto-refresh data after mutations (create, update, delete)
- Empty states with CTAs to guide user actions

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

### Database Migrations & Seeding
**Migrations:**
- Alembic manages migrations in `backend/alembic/versions/`
- Migrations are NOT automatically applied on startup
- Run `alembic upgrade head` manually after pulling new migrations
- Tables are auto-created via `Base.metadata.create_all()` in run.py, but use Alembic for schema changes

**Seeding Default Data:**
- Default care types (user_id=NULL) must be seeded manually
- Run once after database setup: `python seed_defaults.py`
- Default types: Watering, Fertilizing, Repotting, Pruning, Pest Control, Misting
- Script checks for existing defaults and skips if already present

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
- Enhanced checkbox component with larger size, thicker borders for better visual feedback

## Implemented Features

### Dashboard (`/dashboard`)
**Layout order:**
1. Header with title and theme toggle
2. Success/Error alerts
3. Quick Actions (6 buttons):
   - Log Care (outline) - Most frequent daily activity
   - Your Plants (outline) - View plant collection
   - Add Plant (primary) - Main CTA for growing collection
   - Species (outline) - Reference/setup
   - Care Plans (outline) - Setup and management
   - Care Types (outline) - Configuration
4. Upcoming Care section - Cards with "Mark Done" buttons and confirmation dialog
5. Stats Grid (4 cards) - Total Plants, Species Tracked, Upcoming Tasks, Care History

**Key Features:**
- Mark as Done functionality with confirmation dialog for upcoming care tasks
- Auto-refresh after completing care tasks
- Success/error message display
- Real-time stats based on user data

### Plant Management

**View Plants (`/plants`)**
- Grid display of all plants with species info, location, dates
- Edit functionality: Dialog with pre-filled form for nickname, species, location, last watered
- Delete functionality: Confirmation dialog with cascade deletion warning
- Search by species with dropdown filter
- Empty state with CTA to add first plant

**Add Plant (`/plants/add`)**
- Form: nickname (required), species dropdown, location, date added, last watered
- Quick-add species dialog for adding new species inline
- Auto-select newly created species
- Validation and error handling

### Species Management (`/species`)
**Crowdsourced species database** where any user can contribute:
- Browse all species in grid layout
- Add new species form with fields: common name, scientific name, sunlight, water requirements
- Toggle form visibility
- System vs user-created species indicators

### Care Plans (`/care-plans`, `/care-plans/add`)
**View Care Plans:**
- List all active and inactive care plans
- Display: plant name, care type, frequency (days), start date, notes, status badge
- Filter by active/inactive

**Add Care Plan:**
- Plant selection dropdown showing species info card
- Care type selection with quick-add dialog for custom types
- Auto-suggest watering frequency based on species water requirements
- Smart parsing: "weekly" → 7 days, "bi-weekly" → 14 days, "monthly" → 30 days
- Frequency input (days), start date, notes
- Validation and error handling

### Care Logging (`/log-care`)
**Two modes for flexible logging:**
1. **Single Plant Mode** - Quick form for logging one plant's care
2. **Multi-Plant Mode** - Batch logging with checkboxes for multiple plants at once

**Features:**
- Plant selection, care type selection, care date, notes
- Recent care logs display (last 10 activities)
- Real-time updates after logging
- Enhanced checkbox visual states for better UX

### Care Types (`/care-types`)
**Manage care type library:**
- System default types (read-only, muted background): Watering, Fertilizing, etc.
- User custom types (editable): Edit dialog and delete confirmation
- Add custom care type form
- Separation of system vs user types for clarity

### Authentication & Account Management
- Login page (`/login`) with theme toggle
- Registration page (`/register`) with theme toggle
- JWT token storage and management
- Protected routes with automatic redirect to login
- Axios response interceptor for automatic logout on 401 (expired/invalid token)
- User menu dropdown with logout and settings access
- Settings page (`/settings`) with account info display and password change functionality
  - View username and email
  - Change password with current password verification
  - Client-side validation (6+ character minimum, passwords match)
  - Backend authentication and secure password update

### Current State
- Active branch: `feature/react-frontend`
- Fully functional plant tracking application with complete CRUD operations
- All core features implemented: plants, species, care plans, care types, care logging
- Dashboard with upcoming care and mark as done functionality
- Dark/light theme toggle on all pages
- Database service commented out in docker-compose.yml (uses local PostgreSQL)

## Tech Stack Summary

**Backend:** Flask 3.1.1, SQLAlchemy 2.0.41, PostgreSQL, Alembic, Flask-JWT-Extended, Flask-CORS

**Frontend:** React 19.1.1, TypeScript 5.8.3, Vite 7.0.6, Tailwind CSS 4.1.11, shadcn/ui, React Router 7.7.1, Axios 1.11.0

**Deployment:** Docker Compose (Flask on :5000, Nginx serving React on :3000)
