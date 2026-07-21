<div align="center">
  
# 🚀 HireNexa

**A Modern, Full-Stack Job Portal & Recruitment Platform**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](#)
[![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white)](#)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](#)

</div>

<br />

## 📖 Table of Contents
- [About the Project](#-about-the-project)
- [Key Features & Modules](#-key-features--modules)
- [Tech Stack Details](#-tech-stack-details)
- [Project Architecture](#-project-architecture)
- [Getting Started (Installation)](#-getting-started-installation)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#1-database-setup-postgresql)
  - [Backend Setup](#2-backend-setup-java-spring-boot)
  - [Frontend Setup](#3-frontend-setup-reactjs)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Folder Structure](#-folder-structure)
- [License](#-license)

---

## 🎯 About the Project

**HireNexa** is a comprehensive, production-ready job portal web application created to bridge the gap between talented professionals and hiring companies. 

The platform aims to streamline the recruitment process by providing an intuitive, glassmorphism-inspired interface for candidates to easily discover and apply for jobs, while offering administrators a powerful dashboard to manage the platform's content and track key metrics.

---

## ✨ Key Features & Modules

### 👨‍💼 For Job Seekers (Users)
* **Advanced Job Discovery:** Users can browse through job listings and filter them by categories, location, and specific role requirements.
* **Responsive, Dynamic UI:** A beautiful design that adapts flawlessly across desktops, tablets, and mobile devices, utilizing modern micro-animations and hover states.
* **Interactive Application Process:** A seamless workflow for applying to jobs without page reloads, ensuring a smooth user experience.

### 🛡️ For Administrators (Admin Portal & CMS)
* **Centralized Admin Dashboard:** A secure portal providing a bird's-eye view of platform statistics, active users, and total applications.
* **Content Management System (CMS):** Dedicated features allowing admins to dynamically create, edit, update, or delete job listings and platform content on the fly.
* **User Management:** Oversee and manage job seeker profiles and employer accounts.

---

## 💻 Tech Stack Details

### Frontend (Client-Side)
- **Library:** React.js (Component-based architecture)
- **Bundler:** Vite (For blazing-fast Hot Module Replacement and optimized production builds)
- **Styling:** Modern CSS3 with responsive Grid/Flexbox layouts and custom HSL color palettes.
- **Routing:** React Router DOM for seamless Single Page Application (SPA) navigation.
- **Icons:** Lucide React for consistent, scalable vector icons.

### Backend (Server-Side)
- **Language:** Java 21
- **Framework:** Spring Boot 3.3.x (Creating standalone, production-grade Spring based Applications)
- **Architecture:** Standard Controller-Service-Repository pattern.
- **Data Access:** Spring Data JPA / Hibernate ORM for mapping Java objects to database tables.
- **Database:** PostgreSQL (Robust, open-source relational database)
- **Build Tool:** Maven for dependency management and project building.

---

## 🏗️ Project Architecture

HireNexa implements a highly decoupled **Client-Server architecture**, ensuring scalability and separation of concerns:
1. **Presentation Layer:** The React frontend acts as a standalone SPA, communicating with the server entirely through asynchronous HTTP/JSON requests.
2. **Business Logic Layer:** The Java Spring Boot backend handles all complex business rules, data validation, and acts as a secure REST API.
3. **Data Access Layer:** Hibernate translates object-oriented queries into optimized SQL.
4. **Data Storage:** PostgreSQL ensures ACID compliance and persistent data integrity.

---

## 🚀 Getting Started (Installation)

Follow these detailed instructions to get a local development environment running.

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v18 or higher) and npm
- **Java Development Kit (JDK)** (v21 or higher)
- **Apache Maven**
- **PostgreSQL** (Running locally on the default port `5432`)

### 1. Database Setup (PostgreSQL)
1. Open pgAdmin or your PostgreSQL command line.
2. Create a new database named `hirenexa`.
3. Ensure your local postgres username is `postgres` and password is `root` (or update these credentials in the backend properties file).

### 2. Backend Setup (Java Spring Boot)
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd hirenexa-project/backend
   ```
2. *(Optional)* Verify database connection settings in `src/main/resources/application.properties`.
3. Clean, compile, and run the server using Maven:
   ```bash
   mvn clean spring-boot:run
   ```
4. Wait for the console to display `Started HirNexaApplication`. The REST API will now be listening on **http://localhost:8080**.

### 3. Frontend Setup (React.js)
1. Open a **new, separate terminal window** and navigate to the root frontend directory:
   ```bash
   cd hirenexa-project
   ```
2. Install the necessary node modules:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. The terminal will provide a local URL. Open your browser and navigate to **http://localhost:5173**.

---

## 🌐 API Endpoints Overview

The Spring Boot backend exposes several RESTful endpoints (Base URL: `http://localhost:8080`):
- `GET /` : Root Controller (Welcome Page / Health Check)
- `GET /api/jobs` : Fetch all available job listings.
- `GET /api/health` : System health and status check.
*(Additional secure endpoints are available for Admin/CMS operations).*

---

## 📂 Folder Structure

```text
hirenexa-project/
├── backend/                   # Java Spring Boot Server
│   ├── src/main/java/         # Java Source Code (Controllers, Models, Services)
│   ├── src/main/resources/    # Application Properties (DB config)
│   └── pom.xml                # Maven Dependencies
├── src/                       # React Frontend Source
│   ├── components/            # Reusable UI Components
│   ├── pages/                 # Full Page Layouts
│   ├── App.jsx                # Main React Component & Routing
│   └── index.css              # Global Styling
├── package.json               # Node Dependencies
└── vite.config.js             # Vite Bundler Configuration
```

---

<div align="center">
  <p>Built with ❤️ for educational and demonstration purposes.</p>
</div>
