# LiForce Frontend

React + TypeScript + Vite client for the LiForce blood donation platform.

The API lives in a separate repository: **LiForce2-backend** (sibling folder `LiForce2-backend`).

## Prerequisites

- Node.js 18+
- [LiForce2-backend](https://github.com) running locally (default `http://localhost:4000`)

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` in `.env` to your backend URL if it is not `http://localhost:4000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
