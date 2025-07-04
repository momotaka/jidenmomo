-- 廃棄物処理業 経営戦略支援システム データベース設定
-- Database: keiei_system

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS keiei_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 顧客マスタ
CREATE TABLE IF NOT EXISTS keiei_customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    customer_type ENUM('corporate', 'individual', 'government') NOT NULL,
    primary_department ENUM('industrial_waste', 'general_waste', 'cleaning'),
    industry_type VARCHAR(50),
    contract_status ENUM('active', 'inactive', 'prospect') DEFAULT 'active',
    monthly_volume DECIMAL(10,2),
    credit_limit DECIMAL(12,2),
    payment_terms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_type (customer_type),
    INDEX idx_primary_dept (primary_department)
);

-- 部門別売上データ
CREATE TABLE IF NOT EXISTS keiei_department_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department ENUM('industrial_waste', 'general_waste', 'cleaning') NOT NULL,
    sales_date DATE NOT NULL,
    customer_id INT,
    service_type VARCHAR(100),
    quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    total_sales DECIMAL(12,2) NOT NULL,
    direct_cost DECIMAL(12,2) NOT NULL,
    gross_profit DECIMAL(12,2) GENERATED ALWAYS AS (total_sales - direct_cost) STORED,
    contract_type ENUM('spot', 'regular', 'long_term') DEFAULT 'spot',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES keiei_customers(id) ON DELETE SET NULL,
    INDEX idx_dept_date (department, sales_date),
    INDEX idx_customer (customer_id)
);

-- 顧客要望・フィードバック
CREATE TABLE IF NOT EXISTS keiei_customer_feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    feedback_date DATE NOT NULL,
    feedback_text TEXT NOT NULL,
    category VARCHAR(50),
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    status ENUM('new', 'in_progress', 'resolved') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES keiei_customers(id) ON DELETE CASCADE,
    INDEX idx_customer_feedback (customer_id),
    INDEX idx_feedback_date (feedback_date)
);

-- 業界特有KPI
CREATE TABLE IF NOT EXISTS keiei_industry_kpis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department ENUM('industrial_waste', 'general_waste', 'cleaning') NOT NULL,
    kpi_date DATE NOT NULL,
    revenue_per_customer DECIMAL(12,2),
    customer_retention_rate DECIMAL(5,2),
    gross_margin_rate DECIMAL(5,2),
    tons_processed DECIMAL(10,2),
    revenue_per_ton DECIMAL(10,2),
    facility_utilization_rate DECIMAL(5,2),
    collection_efficiency DECIMAL(5,2),
    jobs_completed INT,
    average_job_value DECIMAL(10,2),
    repeat_rate DECIMAL(5,2),
    customer_satisfaction_score DECIMAL(3,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_dept_date (department, kpi_date)
);

-- クロスセル機会管理
CREATE TABLE IF NOT EXISTS keiei_cross_sell_opportunities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    current_service ENUM('industrial_waste', 'general_waste', 'cleaning') NOT NULL,
    potential_service ENUM('industrial_waste', 'general_waste', 'cleaning') NOT NULL,
    opportunity_score INT CHECK (opportunity_score BETWEEN 1 AND 10),
    reason TEXT,
    status ENUM('identified', 'approached', 'converted', 'declined') DEFAULT 'identified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES keiei_customers(id) ON DELETE CASCADE,
    INDEX idx_customer_opportunity (customer_id),
    INDEX idx_status (status)
);

-- 分析結果保存
CREATE TABLE IF NOT EXISTS keiei_analysis_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    analysis_date DATE NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    results JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES keiei_users(id) ON DELETE CASCADE,
    INDEX idx_analysis_date (analysis_date),
    INDEX idx_user_analysis (user_id, analysis_date)
);

-- 戦略アドバイス履歴
CREATE TABLE IF NOT EXISTS keiei_strategy_advice (
    id INT PRIMARY KEY AUTO_INCREMENT,
    analysis_id INT NOT NULL,
    advice_category VARCHAR(50) NOT NULL,
    advice_text TEXT NOT NULL,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    department ENUM('industrial_waste', 'general_waste', 'cleaning', 'all') DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES keiei_analysis_results(id) ON DELETE CASCADE,
    INDEX idx_analysis_advice (analysis_id)
);

-- 初期管理者ユーザー作成（パスワード: admin123）
-- 実際の運用では必ず変更してください
INSERT INTO keiei_users (username, password_hash) VALUES 
('admin', '$2y$10$YourHashedPasswordHere');

-- サンプルデータ（必要に応じて）
-- INSERT INTO keiei_customers (customer_name, customer_type, primary_department, industry_type) VALUES 
-- ('株式会社サンプル製造', 'corporate', 'industrial_waste', '製造業'),
-- ('医療法人テスト病院', 'corporate', 'industrial_waste', '医療機関'),
-- ('サンプル商店', 'corporate', 'general_waste', '小売業');