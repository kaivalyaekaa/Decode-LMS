# Ekaa Registration Portal (MERN Stack)

This is a complete rewrite of the Ekaa Registration Portal using the MERN stack (MongoDB, Express, React, Node.js).

## Folder Structure

- `server/`: Backend API (Node.js + Express + MongoDB)
- `client/`: Frontend Application (React + Vite)

## Prerequisites

- Node.js installed (v14 or higher)
- MongoDB installed and running locally on port 27017

## Quick Start

### Easiest Way (Windows)

Simply double-click `start-both.bat` to start both server and client in separate windows!

### Manual Setup

#### 1. Backend Setup

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   - A `.env` file has been created with default values
   - Default MongoDB URI: `mongodb://localhost:27017/ekaaregistration`
   - Default Port: `5000`
   - Admin credentials: `admin@ekaaglobal.com` / `Admin@123`

4. Start the server:
   ```bash
   node server.js
   ```
   The server will run on `http://localhost:5000`

#### 2. Frontend Setup

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React application:
   ```bash
   npx vite
   ```
   The application will run on `http://localhost:3000`

## Features

- **Registration Form**: Complete replication of the original registration form with all fields and validations
- **Admin Panel**: View all registrations, filter/search, and export to Excel  
- **Admin Login**: Secure authentication with JWT tokens
- **Data Export**: Download registrations as formatted Excel file
- **Data Flow**: React Frontend → Express API → MongoDB Database

## API Endpoints

- `POST /api/registration`: Submit a new registration (public)
- `POST /api/auth/login`: Admin login
- `GET /api/auth/verify`: Verify admin token
- `GET /api/registrations`: Fetch all registrations (admin only)
- `DELETE /api/registration/:id`: Delete a registration (admin only)
- `GET /api/export-excel`: Download registrations as Excel file (admin only)

## Admin Access

- **URL**: `http://localhost:3000/admin-login`
- **Username**: `admin@ekaaglobal.com`
- **Password**: `Admin@123`

## Troubleshooting

If you encounter PowerShell execution policy errors:
- Use the provided `.bat` files instead
- Or run commands directly with `node` instead of `npm`

If MongoDB connection fails:
- Ensure MongoDB is installed and running
- Check that MongoDB is listening on port 27017

