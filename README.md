#  InternMatch: Ecosystem 

**InternMatch** is a "Pro Max" internship matching ecosystem designed to seamlessly connect the next generation of talent with industry leaders. Built with a modern glassmorphism aesthetic and high-efficiency dashboards, it centralizes the entire internship lifecycle—from discovery and market intelligence to application and professional networking.

---

##  Key Features

###  For Students (Talent Portal)
- **Identity Tabbed UI**: A high-efficiency profile manager with categorized sections for *Essentials* (Academic Info) and *Portfolio* (Bio & Featured Projects).
- **Career Readiness Tracker**: Dynamic checklist to ensure students are "industry-ready" before applying.
- **Community Activity**: Share your professional identity with the community and discover what peers are achieving.
- **Application Tracking**: Real-time status updates (Pending, Accepted, Withdrawn) with a polished tracking board.

###  For Employers (Enterprise Suite)
- **Market Intelligence**: Integrated **Job Trends Widget** providing real-time Ph Sector Trends and Internal Demand heatmaps.
- **Talent Discovery**: High-end "View Profile" modal to explore student bios, skills, and projects directly from the community feed.
- **Live Marketplace**: Manage internship postings with a "Pro Max" grid view, featuring competitive insight badges.
- **Unified Notifications**: Stay updated on new applications and community activity via a glassmorphic notification center.

---

##  Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React (Vite) + TypeScript / Tailwind CSS / Vanilla CSS |
| **Backend** | Spring Boot 3.x / Java 17 / Spring Security (JWT) |
| **Database** | MySQL (with JPA/Hibernate) |
| **Visualization** | Recharts (for Market Intelligence & Trends) |
| **Mobile** | Kotlin (Native Android) |

---

##  Development Setup

###  Frontend (Web)
1. Navigate to the `Web` directory:
   ```bash
   cd internmatch/Web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```

###  Backend (Spring Boot)
1. Ensure **Java 17** and **Maven** are installed.
2. Navigate to the `Backend` directory:
   ```bash
   cd internmatch/Backend
   ```
3. Update `src/main/resources/application.yml` with your database credentials.
4. Compile and Run:
   ```bash
   mvn clean compile
   mvn spring-boot:run
   ```

---

##  UI/UX Philosophy
InternMatch follows a **"Pro Max"** design language characterized by:
- **Aurora Glow Effects**: Radiant background elements for visual depth.
- **Glassmorphism**: Translucent surfaces with blur effects for a modern feel.
- **Bento Grid Layouts**: Modular, organized information architecture.
- **Tabbed Efficiency**: Categorized modals to eliminate vertical scrolling and improve user focus.

---

##  Security
- **JWT Authentication**: Stateless, secure communication between layers.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Students, Employers, and Admins.
- **Environment Safety**: Sensitive configurations are handled via `.env` and `application.yml` (git-ignored in production).

---
Developed by **Paul Abellana** as part of Lab 1 for IT342.
