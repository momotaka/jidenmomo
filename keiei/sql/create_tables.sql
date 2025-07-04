-- 廃棄物処理業 経営戦略支援システム
-- データベーステーブル作成SQL
-- プレフィックス: keiei_

-- 1. ユーザーテーブル
CREATE TABLE keiei_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 顧客マスタ
CREATE TABLE keiei_customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    customer_type ENUM('corporate', 'individual', 'government') NOT NULL,
    primary_department ENUM('industrial_waste', 'general_waste', 'cleaning'),
    industry_type VARCHAR(50),
    contract_status ENUM('active', 'inactive', 'prospect'),
    monthly_volume DECIMAL(10,2),
    credit_limit DECIMAL(12,2),
    payment_terms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_type (customer_type),
    INDEX idx_primary_dept (primary_department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 部門別売上データ
CREATE TABLE keiei_department_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department ENUM('industrial_waste', 'general_waste', 'cleaning') NOT NULL,
    sales_date DATE NOT NULL,
    customer_id INT,
    service_type VARCHAR(100),
    quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    total_sales DECIMAL(12,2),
    direct_cost DECIMAL(12,2),
    gross_profit DECIMAL(12,2),
    contract_type ENUM('spot', 'regular', 'long_term'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES keiei_customers(id),
    INDEX idx_dept_date (department, sales_date),
    INDEX idx_sales_date (sales_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 顧客フィードバック
CREATE TABLE keiei_customer_feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    feedback_date DATE NOT NULL,
    feedback_text TEXT NOT NULL,
    category VARCHAR(50),
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES keiei_customers(id),
    INDEX idx_feedback_date (feedback_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 業界特有KPI
CREATE TABLE keiei_industry_kpis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department ENUM('industrial_waste', 'general_waste', 'cleaning') NOT NULL,
    kpi_date DATE NOT NULL,
    -- 共通KPI
    revenue_per_customer DECIMAL(12,2),
    customer_retention_rate DECIMAL(5,2),
    gross_margin_rate DECIMAL(5,2),
    -- 産廃・一廃特有
    tons_processed DECIMAL(10,2),
    revenue_per_ton DECIMAL(10,2),
    facility_utilization_rate DECIMAL(5,2),
    collection_efficiency DECIMAL(5,2),
    -- 清掃特有
    jobs_completed INT,
    average_job_value DECIMAL(10,2),
    repeat_rate DECIMAL(5,2),
    customer_satisfaction_score DECIMAL(3,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_dept_date (department, kpi_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. クロスセル機会管理
CREATE TABLE keiei_cross_sell_opportunities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    current_service ENUM('industrial_waste', 'general_waste', 'cleaning'),
    potential_service ENUM('industrial_waste', 'general_waste', 'cleaning'),
    opportunity_score INT,
    reason TEXT,
    status ENUM('identified', 'approached', 'converted', 'declined'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES keiei_customers(id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 分析結果保存
CREATE TABLE keiei_analysis_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    analysis_date DATE NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    results JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES keiei_users(id),
    INDEX idx_analysis_date (analysis_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 戦略アドバイス履歴
CREATE TABLE keiei_strategy_advice (
    id INT PRIMARY KEY AUTO_INCREMENT,
    analysis_id INT,
    advice_type VARCHAR(50),
    advice_content TEXT,
    priority INT,
    status ENUM('pending', 'implemented', 'rejected'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES keiei_analysis_results(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. ABC分析結果
CREATE TABLE keiei_abc_analysis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    analysis_date DATE NOT NULL,
    product_name VARCHAR(100),
    sales_amount DECIMAL(12,2),
    sales_ratio DECIMAL(5,2),
    cumulative_ratio DECIMAL(5,2),
    rank CHAR(1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_analysis_date (analysis_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. RFM分析結果
CREATE TABLE keiei_rfm_analysis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    analysis_date DATE NOT NULL,
    customer_id INT,
    recency_score INT,
    frequency_score INT,
    monetary_score INT,
    customer_segment VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES keiei_customers(id),
    INDEX idx_analysis_date (analysis_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 季節性パターン
CREATE TABLE keiei_seasonal_patterns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(100),
    month INT,
    avg_sales DECIMAL(12,2),
    seasonal_index DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product_month (product_name, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. 競合情報
CREATE TABLE keiei_competitors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    competitor_name VARCHAR(100),
    product_category VARCHAR(50),
    price_range VARCHAR(50),
    market_share DECIMAL(5,2),
    strengths TEXT,
    weaknesses TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. マーケティング目標
CREATE TABLE keiei_marketing_goals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    goal_type VARCHAR(50),
    target_value DECIMAL(12,2),
    current_value DECIMAL(12,2),
    deadline DATE,
    priority INT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. 施策実行履歴
CREATE TABLE keiei_action_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action_type VARCHAR(50),
    action_detail TEXT,
    implemented_date DATE,
    result TEXT,
    effectiveness_score INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_implemented_date (implemented_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;