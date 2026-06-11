# CENPEEP Boiler Efficiency Calculator
### Full-stack Node.js + MongoDB edition

---

## Features

| Feature | Details |
|---|---|
| **Excel Upload** | Upload the CENPEEP standard `.xlsx` sheet — all input fields auto-populate instantly |
| **MongoDB Storage** | Every calculation can be saved to MongoDB with one click |
| **Sessions Page** | Browse, inspect, and delete past sessions |
| **DB Status Pill** | Live indicator in the navbar shows Online / Offline |
| **CSV & PDF export** | Same as before |

---

## Project Structure

```
cenpeep/
├── server.js              ← Express entry point
├── .env                   ← Add your MONGODB_URI here
├── package.json
├── models/
│   └── Session.js         ← Mongoose schema
├── routes/
│   ├── sessions.js        ← GET / POST / DELETE sessions
│   └── upload.js          ← POST /api/upload  (parses Excel)
└── public/                ← Static frontend (served by Express)
    ├── index.html          login
    ├── calculator.html     main calculator with Excel upload banner
    ├── sessions.html       sessions dashboard
    ├── script.js           all frontend logic
    └── style.css
```

---

## Quick Start

### 1 — Install dependencies
```bash
cd cenpeep
npm install
```

### 2 — Configure MongoDB
Edit `.env` and replace the placeholder with your real URI:
```env
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/cenpeep?retryWrites=true&w=majority
PORT=3000
```
> The app starts even without a valid URI (DB pill shows **Offline**). You can add the URI later and restart.

### 3 — Start the server
```bash
npm start          # production
npm run dev        # with nodemon (auto-restart on changes)
```

### 4 — Open the app
Navigate to **http://localhost:3000**

Login: `admin` / `admin123`

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET`    | `/api/health`         | Server + DB status |
| `GET`    | `/api/sessions`       | All sessions (newest first) |
| `GET`    | `/api/sessions/:id`   | Single session |
| `POST`   | `/api/sessions`       | Save a new session |
| `DELETE` | `/api/sessions/:id`   | Delete a session |
| `POST`   | `/api/upload`         | Upload `.xlsx`, returns extracted field values |

---

## Excel Upload — How It Works

The uploader reads the **CenPeep Corrected** sheet (falls back to sheet 1).  
It scans every row and picks up cells where column D says `Input` **or** where column D is empty and column E contains a plain number (design conditions).  
The Symbol column (C) is matched to the corresponding HTML input `id` via an internal map.  
Fields that don't match (formula rows, constants) are skipped — the front-end recalculates those automatically.

---

## Changing the Login Credentials

Edit `public/index.html`, find this line and update:
```js
if (username === 'admin' && password === 'admin123') {
```

For production, move auth to the Express backend with hashed passwords.
