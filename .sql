
-- =============================
-- ตารางผู้ใช้ระบบ (อาจเป็นผู้โพสต์งานหรือแอดมิน)
-- =============================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    password VARCHAR(255) NULL,          -- ใช้เฉพาะ admin (ผู้โพสต์ทั่วไปไม่จำเป็นต้องสมัคร)
    role ENUM('admin', 'poster') DEFAULT 'poster',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- ตารางหมวดหมู่งาน (ประเภทงาน)
-- =============================
CREATE TABLE job_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- ตารางประกาศงาน
-- =============================
CREATE TABLE jobs (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INT,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    status ENUM('open', 'closed') DEFAULT 'open',
    posted_by INT NULL,                                -- ถ้ามี user_id
    posted_email VARCHAR(150) NOT NULL,                -- สำหรับผู้โพสต์ทั่วไป
    token VARCHAR(255) NOT NULL,                       -- โทเค็นจัดการประกาศ
    token_expire DATETIME,                             -- วันหมดอายุของ token
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES job_categories(category_id),
    FOREIGN KEY (posted_by) REFERENCES users(user_id)
);

-- =============================
-- ตารางประวัติการติดต่อ (ผู้หางานติดต่อผู้โพสต์)
-- =============================
CREATE TABLE job_contacts (
    contact_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    sender_email VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    contacted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(job_id)
);

-- =============================
-- ตารางรายงานประกาศไม่เหมาะสม
-- =============================
CREATE TABLE job_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    reporter_email VARCHAR(150) NOT NULL,
    reason TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'reviewed', 'closed') DEFAULT 'pending',
    FOREIGN KEY (job_id) REFERENCES jobs(job_id)
);

-- =============================
-- ตารางเงื่อนไขการใช้งาน / คำต้องห้าม (admin ตั้งค่า)
-- =============================
CREATE TABLE system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('term', 'banned_word') NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
