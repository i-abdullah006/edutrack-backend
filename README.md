# Student Attendance System - Backend (Phase 1)

Ye Phase 1 hai: Login system, Student management, Manual attendance, Marks module, Settings.

## Isme Kya Hai

- Admin login (bina "remember me")
- Student login (with "remember me")
- Student add/remove/edit (unique username/password auto-generate)
- Manual attendance marking (present/late/absent + date/time save)
- Admin apni marzi se class start time aur late cutoff set kar sakta hai
- Marks module (subject-wise)

## Setup Steps (Free MongoDB Atlas + Free Render.com hosting)

### Step 1: MongoDB Atlas Account Banao (Free Database)

1. https://www.mongodb.com/cloud/atlas/register par jao
2. Free account banao
3. "Create a Free Cluster" (M0 Free tier) choose karo
4. Cluster ban jane ke baad:
   - "Database Access" mein ek user banao (username/password note kar lo)
   - "Network Access" mein "Allow Access from Anywhere" (0.0.0.0/0) add karo
   - "Connect" button dabao, "Drivers" choose karo, connection string copy karo
   - Ye kuch aisa dikhega: `mongodb+srv://username:password@cluster.mongodb.net/`
   - Aakhir mein database ka naam add karo: `mongodb+srv://username:password@cluster.mongodb.net/attendance_system`

### Step 2: Local Testing (Optional, agar apne computer pe test karna ho)

```bash
cd backend
npm install
```

`.env.example` ko copy karke `.env` banao:
```bash
cp .env.example .env
```

`.env` file khol kar apni MongoDB connection string aur ek random JWT_SECRET daalo.

Pehla admin account banane ke liye:
```bash
node setupAdmin.js
```

Server chalane ke liye:
```bash
npm start
```

Browser mein `http://localhost:5000` khol kar check karo, "Attendance System API chal raha hai" dikhna chahiye.

### Step 3: GitHub Par Code Upload Karo

1. https://github.com par account banao (agar nahi hai)
2. Naya repository banao (jaise "attendance-system")
3. Is `backend` folder ka sara code us repository mein upload karo

### Step 4: Render.com Par Free Deploy Karo

1. https://render.com par account banao (GitHub se sign up kar sakte ho)
2. "New +" > "Web Service" click karo
3. Apna GitHub repository connect karo
4. Settings:
   - **Root Directory**: `backend` (agar backend folder alag hai)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. "Environment Variables" mein ye add karo (`.env.example` ke mutabiq):
   - `MONGO_URI` = apni MongoDB connection string
   - `JWT_SECRET` = koi bhi lamba random string
   - `INITIAL_ADMIN_USERNAME` = admin
   - `INITIAL_ADMIN_PASSWORD` = koi strong password
6. "Create Web Service" dabao aur deploy hone do (2-3 minute lagenge)

### Step 5: Pehla Admin Banao (Deploy Hone Ke Baad)

Render ke "Shell" tab mein jao (dashboard ke andar) aur chalao:
```bash
node setupAdmin.js
```

Ye ek dafa chalana hai. Admin username/password terminal mein dikhega.

## API Endpoints (Reference)

### Auth
- `POST /api/auth/admin/login` - `{ username, password }`
- `POST /api/auth/student/login` - `{ username, password, rememberMe }`
- `POST /api/auth/student/auto-login` - `{ rememberToken }`

### Students (Admin only, token chahiye)
- `POST /api/students` - naya student add karo `{ name, rollNo, className }`
- `GET /api/students` - sab students ki list
- `GET /api/students/:id` - ek student ki detail
- `PUT /api/students/:id` - student edit karo
- `DELETE /api/students/:id` - student remove karo
- `POST /api/students/:id/reset-password` - password reset

### Attendance
- `POST /api/attendance/mark` (Admin) - `{ studentId, status, date }`
- `POST /api/attendance/mark-bulk` (Admin) - `{ records: [{studentId, status}], date }`
- `GET /api/attendance/date/:date` (Admin) - ek din ki poori attendance
- `GET /api/attendance/student/:studentId` (Admin) - ek student ki history
- `GET /api/attendance/my-attendance` (Student) - apni attendance

### Marks
- `POST /api/marks` (Admin) - `{ studentId, subject, examType, marksObtained, totalMarks, date }`
- `GET /api/marks/student/:studentId` (Admin)
- `GET /api/marks/my-marks` (Student)
- `PUT /api/marks/:id` (Admin)
- `DELETE /api/marks/:id` (Admin)

### Settings
- `GET /api/settings` (Admin) - class start time, late cutoff, method dekho
- `PUT /api/settings` (Admin) - `{ classStartTime, lateCutoffMinutes, todaysMethod }`

## Agla Phase

Phase 2 mein frontend (React website jisay log dekhenge aur use karenge) banega jo in APIs ko call karega. Phase 3 mein face recognition, Phase 4 mein fingerprint add hoga.
