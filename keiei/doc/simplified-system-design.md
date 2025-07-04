# 販売戦略支援システム - システム設計書（簡易版）

## 技術アーキテクチャ

### 技術スタック
- **フロントエンド**: 
  - HTML5（セマンティックHTML）
  - CSS3（レスポンシブデザイン）
  - JavaScript（Vanilla JS、ES6+）
  - Chart.js 4.x（グラフ表示）
- **バックエンド**: 
  - PHP 8.2
  - セッション管理（PHP Sessions）
- **データベース**: 
  - MySQL 8.0
  - UTF8MB4文字セット
- **その他**: 
  - TCPDF（PDF生成）

## データベース設計

### ERD概要
```
users (1) -----> (n) analysis_results
                          |
sales_data (n) ----------+
                          |
customers (1) -----> (n) customer_feedback
```

### テーブル定義

#### 1. users（ユーザー）
```sql
CREATE TABLE keiei_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. sales_data（売上データ）
```sql
CREATE TABLE keiei_sales_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(100) NOT NULL,
    sales_date DATE NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_sales DECIMAL(12,2) NOT NULL,
    cost_of_goods DECIMAL(12,2) NOT NULL,
    fixed_cost DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sales_date (sales_date),
    INDEX idx_product (product_name)
);
```

#### 3. customers（顧客マスタ）
```sql
CREATE TABLE keiei_customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    customer_type VARCHAR(50),
    age_group VARCHAR(20),
    region VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. customer_feedback（顧客要望）
```sql
CREATE TABLE keiei_customer_feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    feedback_date DATE NOT NULL,
    feedback_text TEXT NOT NULL,
    category VARCHAR(50),
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES keiei_customers(id)
);
```

#### 5. analysis_results（分析結果）
```sql
CREATE TABLE keiei_analysis_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    analysis_date DATE NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    results JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES keiei_users(id),
    INDEX idx_analysis_date (analysis_date)
);
```

## 主要機能の実装設計

### 1. 認証システム
```php
// includes/auth.php
class Auth {
    public static function login($username, $password) {
        // DBからユーザー情報取得
        // password_verify()で検証
        // セッション開始
    }
    
    public static function checkSession() {
        // セッション確認
        // 未ログインならログイン画面へリダイレクト
    }
    
    public static function logout() {
        // セッション破棄
    }
}
```

### 2. データ分析ロジック
```php
// includes/analysis.php
class SalesAnalysis {
    // 粗利率計算
    public function calculateGrossMargin($sales, $cost) {
        return (($sales - $cost) / $sales) * 100;
    }
    
    // 商品別収益性分析
    public function analyzeProductProfitability($period) {
        // 売上データ集計
        // 粗利率計算
        // ランキング作成
    }
    
    // 顧客セグメント分析
    public function analyzeCustomerSegments() {
        // 顧客属性別の売上集計
        // 購買パターン分析
    }
}
```

### 3. 戦略提案エンジン
```php
// includes/strategy.php
class StrategyEngine {
    private $rules = [
        'low_margin' => '価格見直しまたはコスト削減を検討',
        'high_demand' => '在庫増強と生産能力拡大を検討',
        'customer_complaint' => '品質改善と顧客対応強化',
        // その他のルール
    ];
    
    public function generateAdvice($analysisData) {
        // 分析結果に基づく戦略提案
        // ルールベースのアドバイス生成
    }
}
```

## API設計（内部処理）

### データ取得・保存
```php
// api/sales.php
POST /api/sales/save    # 売上データ保存
GET  /api/sales/list    # 売上データ一覧
GET  /api/sales/summary # 売上サマリー

// api/customers.php  
POST /api/customers/feedback  # 顧客要望保存
GET  /api/customers/list      # 顧客一覧
```

## セキュリティ実装

### 1. 入力検証
```php
function validateInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
```

### 2. SQLインジェクション対策
```php
// プリペアドステートメント使用
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$username]);
```

### 3. セッション管理
```php
// セッション設定
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 1); // HTTPS環境
```

## ディレクトリ構造
```
keiei/
├── index.php              # エントリーポイント
├── login.php              # ログイン画面
├── dashboard.php          # ダッシュボード
├── includes/
│   ├── config.php         # 設定ファイル
│   ├── db.php            # DB接続クラス
│   ├── auth.php          # 認証クラス
│   ├── analysis.php      # 分析クラス
│   └── strategy.php      # 戦略提案クラス
├── pages/
│   ├── input_sales.php   # 売上入力
│   ├── input_customer.php # 顧客入力
│   ├── analysis.php      # 分析画面
│   └── report.php        # レポート
├── api/                  # 内部API
│   ├── sales.php
│   └── customers.php
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   └── charts.js
│   └── images/
└── sql/
    └── setup.sql         # DB初期化スクリプト
```

## パフォーマンス考慮事項
- 月2回の使用のため、リアルタイム性より操作性を重視
- 必要最小限のJavaScriptで高速な画面遷移
- インデックスを適切に設定してクエリを最適化

## 開発・デプロイ手順
1. MySQL DBの作成とテーブル設定
2. PHP環境の設定（PHP 8.2以上）
3. 設定ファイルの編集（DB接続情報など）
4. 初期ユーザーの登録
5. 動作確認