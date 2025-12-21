# CargoNepal

A robust, scalable full-stack logistics and cargo management platform built with the MERN stack (MongoDB, Express, React, Node.js), designed for the Nepalese market. CargoNepal enables seamless truck booking, fleet management, and real-time cargo tracking for customers, truck owners, and administrators.

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)
- [License](#license)

---

## Features
- Secure authentication with email OTP verification and JWT sessions
- Role-based dashboards: Customer, Owner, Admin
- Truck listing, advanced filtering (type, capacity, location), and geolocation (OpenCage API)
- Smart booking system with real-time conflict detection and availability
- Real-time notifications (Socket.io) for bookings, verifications, and system events
- Fleet management for owners: add, update, verify, and track trucks
- Admin dashboard: user/truck verification, analytics, notification management
- Customer dashboard: booking history, payment integration, live tracking
- Reviews and ratings for trucks and owners
- RESTful API with rate limiting, sanitization, and CORS
- Responsive, mobile-friendly React frontend with protected routes
- Automated email notifications for registration, bookings, password resets
- Comprehensive logging and error handling

---

## Tech Stack
- **Frontend:** React 18, Vite, TailwindCSS, MUI, React Router, React Query, Axios, Socket.io-client
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.io, JWT, Cloudinary, Nodemailer
- **Dev Tools:** Vercel (frontend), Render (backend), Docker, ESLint, Prettier

---

## Project Structure

```

CargoNepal_Final/
├── backend/
│   ├── controllers/   # Express route controllers
│   ├── middleware/    # Auth, rate limiting, sanitization
│   ├── models/        # Mongoose schemas (User, Truck, Booking, etc.)
│   ├── routes/        # Express routers (auth, trucks, bookings, etc.)
│   ├── services/      # Business logic, notifications, email
│   ├── utils/         # Helpers (logger, conflict detection, etc.)
│   ├── config/        # DB, env, and other configs
│   ├── server.js      # Main Express server
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/   # Shared UI components
│   │   ├── context/      # React contexts (Auth, UI feedback)
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # App pages (Landing, Dashboard, Trucks, etc.)
│   │   ├── utils/        # Axios instance, helpers
│   │   ├── config/       # API endpoints
│   │   └── App.jsx       # Main app
│   ├── public/
│   ├── index.html
│   └── ...
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB database (Atlas or local)
- Cloudinary account (for image uploads)
- Email service credentials (for notifications)
- [Vercel](https://vercel.com/) and [Render](https://render.com/) accounts for deployment (optional)

### Backend Setup
```sh
cd backend
npm install
cp .env.example .env    # Fill in all required values
npm run dev             # Start development server
```

### Frontend Setup
```sh
cd frontend
npm install
cp .env.example .env    # Set VITE_API_BASE_URL to your backend API URL
npm run dev             # Start frontend dev server
```

---

## Environment Variables

### Backend (`backend/.env`)
See `backend/.env.example` for all options. Key variables:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing key
- `MAIL_USER`, `MAIL_PASS` - Email credentials
- `CLOUDINARY_*` - Cloudinary API keys
- `CLIENT_URL` - Frontend URL
- `PORT` - Backend port
- `OPENCAGE_API_KEY` - Geocoding API key

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL` - URL of the backend API

---

## Scripts
### Backend
- `npm run dev` - Start backend with nodemon
- `npm start` - Start backend (production)
- `npm run seed` - Seed admin user
- `npm run seed:all` - Seed all demo data

### Frontend
- `npm run dev` - Start frontend dev server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build

---

## API Overview
- RESTful endpoints under `/api/`
- Main resources: auth, trucks, bookings, users, reviews, notifications, payments
- JWT authentication required for protected routes
- See backend `routes/` and `controllers/` for details

---

## Usage Examples

### Register & Verify Email
```http
POST /api/auth/register
{
  "name": "Sita Thapa",
  "email": "sita@example.com",
  "password": "securePass123",
  "role": "customer"
}
```
Check your email for OTP, then:
```http
POST /api/auth/verify-otp
{
  "email": "sita@example.com",
  "otp": "123456"
}
```

### Book a Truck (Customer)
```http
POST /api/bookings
Authorization: Bearer <token>
{
  "truckId": "...",
  "pickup": { "address": "Kathmandu" },
  "dropoff": { "address": "Pokhara" },
  "startTime": "2024-06-01T08:00:00Z",
  "endTime": "2024-06-01T20:00:00Z",
  "capacityTons": 10
}
```

### Add Truck (Owner)
```http
POST /api/owner/trucks
Authorization: Bearer <token>
{
  "title": "Ashok Leyland 10T",
  "type": "Flatbed",
  "capacityTons": 10,
  "locationString": "Biratnagar, Nepal"
}
```

---

## FAQ

**Q: How do I deploy to production?**
A: Deploy `/frontend` to Vercel and `/backend` to Render. Set all environment variables in each platform's dashboard.

**Q: What roles are supported?**
A: Customer, Owner, Admin. Each has a dedicated dashboard and permissions.

**Q: How is real-time communication handled?**
A: Via Socket.io for notifications and live updates.

**Q: Where are images stored?**
A: Images are uploaded to Cloudinary via the backend.

**Q: Can I run MongoDB locally?**
A: Yes, but MongoDB Atlas is recommended for production.

---

## Contributing
Pull requests and issues are welcome! Please:
- Fork the repo and create a feature branch
- Write clear commit messages
- Follow code style and linting rules
- Add tests for new features if possible

---

## Acknowledgments
- Inspired by logistics needs in Nepal
- [MongoDB Atlas](https://www.mongodb.com/atlas), [Vercel](https://vercel.com/), [Render](https://render.com/), [Cloudinary](https://cloudinary.com/), [OpenCage Geocoding](https://opencagedata.com/)
- Thanks to all open-source contributors

---

## License
[MIT](LICENSE)
