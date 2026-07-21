# HireNexa - Job Portal Project Report

## 1. Project Overview
**Project Name:** HireNexa
**Purpose:** A modern, comprehensive job portal application designed to connect job seekers with employers efficiently.

## 2. Technology Stack
* **Frontend:** React.js (Vite), HTML5, CSS3
* **Backend:** Java Spring Boot
* **Database:** PostgreSQL (with Spring Data JPA)
* **Build Tools:** Maven (Backend), npm (Frontend)

## 3. Key Features & Modules
### For Users (Job Seekers)
* **Job Search & Filtering:** Users can browse and filter jobs based on categories, location, and requirements.
* **Responsive UI:** Modern, dynamic user interface optimized for all devices.

### For Administrators (Admin Portal & CMS)
* **Admin Dashboard:** Centralized control for managing jobs and user statistics.
* **Content Management System (CMS):** Dedicated portal to update content dynamically.

## 4. Architecture
The system follows a standard Client-Server architecture:
* **Client Layer:** The React frontend handles user interactions and renders the dynamic interface.
* **API Layer:** The Spring Boot backend exposes RESTful APIs to serve data to the frontend.
* **Data Layer:** PostgreSQL stores structured data (users, jobs, etc.) securely.

## 5. Setup & Installation
### Backend Setup
1. Navigate to the `backend` directory.
2. Run `mvn spring-boot:run` to start the REST API on port `8080`.

### Frontend Setup
1. Navigate to the root directory.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the React application on port `5173`.

## 6. Conclusion
HireNexa is a full-stack, production-ready web application built with modern web technologies, designed to demonstrate proficiency in both frontend and backend software development practices.
