# 🎓 InternMatch

**InternMatch** is a web-based internship matching platform designed to connect students with organizations offering internship opportunities.  
It provides a centralized system for managing internship postings, applications, and user roles within a university or academic context.

## 🏗️ System Overview

- Provide students with an easy way to discover and apply for internship opportunities
- Help organizations manage internship postings and track applicants
- Centralize internship-related processes for academic institutions
- Replace manual internship coordination (email, social media, spreadsheets)

## 👥 User Roles

### 👨‍🎓 Students

- Create and manage profiles
- Browse and apply for internships
- Track application status

### 🛡️ Administrators
- Manage users and internship postings
- Monitor system activity

### 🏢 Employer Representatives
- Post and manage internship opportunities
- Review student applications

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

### Mobile
- Kotlin (Android native app development)


### Step 1: Frontend Setup

1. **Install React**:
   ```bash
   npm install
   npm run dev

---

### Step 2: Backend Setup

1. **Prerequisites:**  
   - Java JDK 17 (or your project’s required version) installed  
   - Maven installed  
   - MySQL or PostgreSQL database set up and running  

2. **Clone the repository and navigate to backend folder:**  
```bash
git clone <your-repo-url>
cd backend

```

3. **Configure database connection and JWT settings:**:
-Create or edit the src/main/resources/application.properties file with your database credentials and JWT secret key:
```# Database configuration
spring.datasource.url=jdbc:mysql://localhost:3306/internmatch
spring.datasource.username=your_db_username
spring.datasource.password=your_db_password

# JPA/Hibernate settings
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# JWT configuration
jwt.secret=your_jwt_secret_key
jwt.expiration=86400000  # (milliseconds, e.g., 1 day)

```

4. **Build and run the backend server:**:
```bash
mvn clean install
mvn spring-boot:run
```

5. **Backend API will be available at:**:
```
http://localhost:8080 (default port)
```

