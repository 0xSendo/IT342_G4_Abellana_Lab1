# 🎓 InternMatch

**InternMatch** is a web-based internship matching platform designed to connect students with organizations offering internship opportunities.  
It provides a centralized system for managing internship postings, applications, and user roles within a university or academic context.

---

## 🎯 Project Objectives

- Provide students with an easy way to discover and apply for internship opportunities
- Help organizations manage internship postings and track applicants
- Centralize internship-related processes for academic institutions
- Replace manual internship coordination (email, social media, spreadsheets)

---

## 👥 User Roles

### 👨‍🎓 Students
- Create and manage profiles
- Browse and apply for internships
- Track application status

### 🏢 Employer Representatives
- Post and manage internship opportunities
- Review student applications

### 🛡️ Administrators
- Manage users and internship postings
- Monitor system activity

---

## ⚙️ System Features

- Role-based user authentication (JWT)
- Student profile management
- Internship posting and application system
- Application tracking with status updates
- Admin management panel
- Secure relational database storage

---

## 🧱 Technology Stack

### Frontend
- React.js (Vite)
- JavaScript
- React Router
- CSS (Responsive Design)

### Backend
- Spring Boot
- Spring Security
- JWT Authentication
- Spring Data JPA

### Database
- MySQL / PostgreSQL

---

## 🚀 Getting Started

### Frontend Setup
```bash
npm install
npm run dev

### Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run

### Environment Variables
 -Create a .env or application.properties file in the backend project and configure the following:
 # Database configuration
spring.datasource.url=jdbc:mysql://localhost:3306/internmatch
spring.datasource.username=your_db_username
spring.datasource.password=your_db_password

# JWT configuration
jwt.secret=your_jwt_secret_key
jwt.expiration=86400000  # in milliseconds (e.g., 1 day)

