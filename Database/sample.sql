-- Create Database
CREATE DATABASE IF NOT EXISTS internmatch;
USE internmatch;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    program VARCHAR(255),
    year_level VARCHAR(50),
    skills TEXT,
    company_name VARCHAR(255),
    company_location VARCHAR(255),
    company_website VARCHAR(255),
    department VARCHAR(255),
    phone VARCHAR(50)
);

-- Internships Table
CREATE TABLE IF NOT EXISTS internships (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    setup VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    posted_by_id BIGINT NOT NULL,
    created_at DATE NOT NULL,
    updated_at DATE NOT NULL,
    FOREIGN KEY (posted_by_id) REFERENCES users(id)
);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    internship_id BIGINT NOT NULL,
    resume_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL,
    applied_at DATETIME NOT NULL,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (internship_id) REFERENCES internships(id)
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    sent_at DATETIME NOT NULL
);

-- Sample Data (Optional)
-- INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@internmatch.com', '$2a$10$...', 'ADMIN');
