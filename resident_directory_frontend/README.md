# Resident Directory Frontend (React)

Runs on preview port **3000**.

## Quick start (local)

```bash
npm install
npm start
```

App: http://localhost:3000

## Configuration

The frontend calls the backend at:

- `REACT_APP_API_BASE_URL` (default `http://localhost:3001`)

See `.env.example`.

## Features

- Public: browse/search residents, view resident details
- Auth: login/logout (JWT stored in localStorage)
- Admin: add/edit/delete residents and upload photos via backend

## Demo accounts (seeded by backend)

- Admin: `admin@example.com` / `admin123`
- User: `user@example.com` / `user123`
