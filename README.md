# 🩸 LiForce 

> **"Every drop counts."**

LiForce is a modern, real-time blood donation platform that bridges the critical gap between voluntary blood donors, blood banks, and patients in emergency need.

This repository contains the **Frontend** client built with React, TypeScript, and Vite. The API and Database logic live in a separate sibling repository (`LiForce2-backend`).

## ✨ Key Features

- **🚨 Emergency SOS System:** Instantly broadcast critical blood requests. The system uses Haversine geolocation to match and notify donors within a 50km radius and blood banks within 200km.
- **🏥 Live Blood Bank Inventory:** Blood banks can manage their real-time inventory levels, accept walk-in donations, and respond directly to SOS alerts.
- **🤖 Smart AI Assistant:** Integrated with the **Gemini 2.5 Flash API**, the built-in chatbot acts as a dedicated platform assistant to guide users on eligibility rules, reward points, and platform navigation.
- **🏆 Gamification & Rewards:** Donors earn 100 Reward Points for every successful donation, climbing the global Leaderboard to earn Gold and Diamond status badges.
- **🗺️ Live Interactive Maps:** Visualize real-time emergency requests and nearby available donors/banks using Leaflet maps.
- **📅 Community Camps:** Discover, join, and organize local blood donation drives.

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion (for animations), React-Leaflet (for interactive maps), React Hook Form + Zod (for validation).
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL.

## 🚀 Prerequisites

Before you begin, ensure you have the following installed on your local machine:
- Node.js (v18 or higher)
- Git
- A running instance of the [LiForce2-backend](https://github.com) (usually running on `http://localhost:4000`)

## 💻 Local Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd LiForce2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and ensure `VITE_API_URL` points to your backend URL (default is `http://localhost:4000`).

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will start at `http://localhost:5173`.

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles TypeScript and creates an optimized production build in the `dist` folder. |
| `npm run preview` | Boots up a local web server to preview your production build. |
| `npm run lint` | Runs ESLint to find and fix code style issues. |

## 🌍 Deployment

LiForce is optimized for seamless deployment.

### Frontend (Vercel)
1. Push your code to GitHub.
2. Import the project into Vercel.
3. Vercel will automatically detect Vite. 
4. Add the `VITE_API_URL` environment variable pointing to your live backend (e.g., `https://your-api.onrender.com`).
5. Click **Deploy**.

### Backend (Render)
1. Import the backend repository into Render as a Web Service.
2. Provide a PostgreSQL database URL and other necessary API keys (`JWT_SECRET`, `GEMINI_API_KEY`).
3. Set the Build Command to `npm install && npx prisma generate && npx prisma db push && npm run build`.
4. Set the `FRONTEND_URL` to your live Vercel domain to ensure secure CORS configuration.

---
*Built with ❤️ to save lives.*
