# Plant Tracker

Plant Tracker is a web app for keeping track of your houseplants. Remember to water them, log the care you give, and watch them grow over time with photos. It's built for anyone who has ever forgotten a watering (or three) during a busy season.

> _In the winter, or when you're busy in the summer, it's easy to lose track of watering your plants. Plant Tracker keeps a gentle record of the care you provide, from watering and fertilizing to repotting and your own custom care types, so nothing slips through the cracks._

![Dashboard](docs/dashboard.png)

## Tech Stack

![Flask](https://img.shields.io/badge/Flask-3.1-000?logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

- **Backend:** Flask REST API (Python 3.11), SQLAlchemy 2.0, Alembic migrations, JWT auth.
- **Frontend:** React 19 SPA, TypeScript, Vite, Tailwind CSS with shadcn/ui.
- **Storage:** PostgreSQL for data, plus photos on disk (with HEIC to JPEG conversion and thumbnails).
- **Deployment:** Docker Compose (Flask on `:5000`, Nginx-served frontend on `:3001`).

## Features

- **Plant collection:** add plants, assign species and location, attach photos, and set a cover image.
- **Care logging:** record watering, fertilizing, repotting, and more. Log a single plant or batch log several at once.
- **Care plans:** schedule recurring care on a cadence (for example weekly watering) and see what's upcoming.
- **Custom care types:** extend the built-in library (Watering, Fertilizing, and more) with your own.
- **Species reference:** a crowdsourced list of species with sunlight and water-need guidance.
- **Photos:** drag-and-drop upload, galleries with a lightbox, cover photo reordering, and automatic thumbnails.
- **Dashboard:** upcoming care at a glance, quick actions, and one-tap "mark done."
- **Dark and light theme** throughout the app.

## Project Structure

```
plant-tracker/
├── backend/            # Flask REST API (Python)
│   ├── app/
│   │   ├── api/        # Route handlers (blueprints)
│   │   ├── models/     # SQLAlchemy models
│   │   ├── services/   # Business logic
│   │   └── decorators/ # Auth decorators
│   ├── alembic/        # Database migrations
│   └── run.py          # Entry point
├── frontend/           # React SPA (TypeScript + Vite)
│   └── src/
│       ├── api/        # Axios client + endpoint modules
│       ├── pages/      # Route components
│       ├── components/ # UI + shared components
│       └── types/      # TypeScript interfaces
├── uploads/            # Photo storage (gitignored)
├── docker-compose.yml
└── .env                # Environment variables (gitignored)
```
