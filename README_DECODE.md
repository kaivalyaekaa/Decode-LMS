# DECODE LMS - Setup & Usage Guide

## Overview
The Ekaa Registration Portal has been upgraded to **DECODE LMS**, a comprehensive Learning Management System with role-based access, attendance tracking, payment verification, and automated certificate issuance.

## 1. Setup

### Install Dependencies
```bash
cd server
npm install
```

### Configure Environment
Update `server/.env` with your email credentials for automated certificate delivery:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Seed Database (Initial Users)
Run the seed script to create default users for Instructor, Finance, and Management roles:
```bash
cd server
node seed.js
```
*This will create users with password: `password123`*

## 2. Roles & Credentials

| Role | Username | Password | Features |
|------|----------|----------|----------|
| **Instructor** | `instructor` | `password123` | Mark attendance, view student lists |
| **Finance** | `finance` | `password123` | Verify payments, view revenue stats |
| **Management** | `management` | `password123` | Approve & issue certificates, view history |

## 3. Workflow

1.  **Registration**: Students register via the public registration form.
2.  **Instructor**: Logs in, views students, and marks attendance for each level.
3.  **Finance**: Logs in, checks payment status, and marks students as "Paid".
4.  **Management**: Logs in, sees eligible students (Paid + Completed), and clicks "Issue Certificate".
5.  **Certificate**: System automatically generates a PDF, digitally signs it, and emails it to the student.
6.  **Verification**: Anyone can verify a certificate at `/verify-certificate/:certificateNumber`.

## 4. Running the App

Start both client and server:
```bash
# Terminal 1 (Server)
cd server
npm start

# Terminal 2 (Client)
cd client
npm run dev
```

## 5. Troubleshooting

*   **Email Errors**: If certificate emails fail, check your `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`. You may need to use an "App Password" if using Gmail.
*   **Login Failed**: Ensure you ran `node seed.js` to create the initial users.
