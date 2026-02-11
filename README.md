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

---

## 🛠️ API Endpoints (Summary)

### Authentication
- `POST /auth/register` – Register a new user  
- `POST /auth/login` – Log in and receive JWT token  
- `POST /auth/logout` – Logout user (invalidate token)  

### Students
- `GET /students/profile` – Retrieve student profile  
- `PUT /students/profile` – Update student profile  

### Internships
- `GET /internships` – List all internships (supports search and filters)  
- `GET /internships/{id}` – View internship details  
- `POST /internships` – Create internship (employer role only)  

### Applications
- `POST /applications` – Submit a new internship application  
- `GET /applications` – List applications (filtered by user role)  
- `PUT /applications/{id}/status` – Update application status (employer only)  

### Admin
- `GET /admin/users` – List all users  
- `DELETE /admin/users/{id}` – Delete a user account  
- `GET /admin/internships` – Monitor internship postings  

---

## 📌 Features Roadmap

### Must-Have
- User authentication with role-based access
- Student profile management
- Internship posting and application system
- Application tracking with status updates
- Admin panel for oversight

### Should-Have (Future Enhancements)
- Resume upload functionality
- Internship bookmarking/favorites
- Employer profile pages
- Advanced analytics and reporting dashboard

---

## 🗂️ Project Structure (Example)


