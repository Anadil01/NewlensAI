# HN Insight Hub

A full-stack MERN application that scrapes top stories from Hacker News and allows authenticated users to bookmark stories.

## Features

- Hacker News scraping using Axios + Cheerio
- JWT Authentication
- User Registration/Login
- Bookmark stories
- Protected routes
- REST APIs
- Responsive React frontend

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- JWT
- Cheerio

### Frontend
- React
- React Router DOM
- Axios
- Context API

## Installation

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend

```env
PORT=5001
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
```

### Frontend

```env
VITE_API_URL=http://localhost:5001/api
```

## Deployment

- Frontend deployed on Vercel
- Backend deployed on Render

## Author

Anadil