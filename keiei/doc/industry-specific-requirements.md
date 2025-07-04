# 廃棄物処理業特化型 販売戦略支援システム

## 事業部門構成

### 1. 産業廃棄物部門
- **サービス内容**
  - 産業廃棄物の受け入れ（自社施設）
  - 依頼を受けての収集運搬
- **特徴**
  - B2B取引が中心
  - 契約単価が高い
  - 法規制対応が重要
  - 長期契約が多い

### 2. 一般廃棄物部門
- **サービス内容**
  - 定期収集（ルート回収）
  - 一般廃棄物の受け入れ
- **特徴**
  - 定期収入が安定
  - 地域密着型
  - 自治体との関係が重要
  - 価格競争が激しい

### 3. 清掃サービス部門
- **サービス内容**
  - 水回りの清掃
  - 高圧洗浄
  - その他特殊清掃
- **特徴**
  - スポット案件が多い
  - 季節変動あり
  - 技術力が差別化要因
  - リピート率が重要

## データベース設計（改訂版）

### 部門別売上データ
```sql
CREATE TABLE keiei_department_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department ENUM('industrial_waste', 'general_waste', 'cleaning') NOT NULL,
    sales_date DATE NOT NULL,
    customer_id INT,
    service_type VARCHAR(100),
    quantity DECIMAL(10,2),  -- 重量(t)または回数
    unit_price DECIMAL(10,2),
    total_sales DECIMAL(12,2),
    direct_cost DECIMAL(12,2),  -- 処理費、人件費など
    gross_profit DECIMAL(12,2),
    contract_type ENUM('spot', 'regular', 'long_term'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES keiei_customers(id),
    INDEX idx_dept_date (department, sales_date)
);
```

### 顧客マスタ（改訂版）
```sql
CREATE TABLE keiei_customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    customer_type ENUM('corporate', 'individual', 'government') NOT NULL,
    primary_department ENUM('industrial_waste', 'general_waste', 'cleaning'),
    industry_type VARCHAR(50),  -- 製造業、飲食業、医療機関など
    contract_status ENUM('active', 'inactive', 'prospect'),
    monthly_volume DECIMAL(10,2),  -- 月間取扱量の目安
    credit_limit DECIMAL(12,2),
    payment_terms INT,  -- 支払サイト（日数）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 業界特有KPI
```sql
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
    facility_utilization_rate DECIMAL(5,2),  -- 施設稼働率
    collection_efficiency DECIMAL(5,2),  -- 収集効率（km/t）
    
    -- 清掃特有
    jobs_completed INT,
    average_job_value DECIMAL(10,2),
    repeat_rate DECIMAL(5,2),
    customer_satisfaction_score DECIMAL(3,1),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_dept_date (department, kpi_date)
);
```

### クロスセル機会管理
```sql
CREATE TABLE keiei_cross_sell_opportunities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    current_service ENUM('industrial_waste', 'general_waste', 'cleaning'),
    potential_service ENUM('industrial_waste', 'general_waste', 'cleaning'),
    opportunity_score INT,  -- 1-10の可能性スコア
    reason TEXT,
    status ENUM('identified', 'approached', 'converted', 'declined'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES keiei_customers(id)
);
```

## 業界特化型分析機能

### 1. 部門別収益性分析
```php
class DepartmentAnalysis {
    // 部門別の収益性比較
    public function compareDepartmentProfitability($period) {
        // 各部門の売上高、粗利率、成長率を算出
        // 部門間のバランスを評価
        // リソース配分の最適化提案
    }
    
    // 顧客の部門横断利用率
    public function analyzeCrossUtilization() {
        // 複数部門を利用している顧客の抽出
        // 単一部門のみ利用顧客のクロスセル可能性評価
    }
}
```

### 2. 廃棄物処理業特有の戦略
```php
class WasteIndustryStrategy {
    private $strategies = [
        'industrial_waste' => [
            'capacity_optimization' => [
                '条件' => '施設稼働率が80%以下',
                'アクション' => '新規大口顧客の開拓、営業エリア拡大'
            ],
            'compliance_advantage' => [
                '条件' => '法規制強化時',
                'アクション' => 'コンプライアンス対応力を差別化要因として訴求'
            ],
            'contract_renewal' => [
                '条件' => '契約更新3ヶ月前',
                'アクション' => '複数年契約への切り替え提案、付加サービス追加'
            ]
        ],
        
        'general_waste' => [
            'route_optimization' => [
                '条件' => '収集効率が低下',
                'アクション' => 'ルート最適化、顧客密度の高いエリアへの集中'
            ],
            'municipal_relations' => [
                '条件' => '自治体入札時期',
                'アクション' => '実績アピール、地域貢献活動の強化'
            ]
        ],
        
        'cleaning' => [
            'seasonal_campaign' => [
                '条件' => '繁忙期前（年末、梅雨前など）',
                'アクション' => '早期予約割引、パッケージ提案'
            ],
            'quality_differentiation' => [
                '条件' => '価格競争激化',
                'アクション' => '専門技術・資格のアピール、ビフォーアフター事例'
            ]
        ]
    ];
    
    // 部門間シナジー戦略
    public function generateSynergyStrategy($customerData) {
        $suggestions = [];
        
        // 産廃利用企業への一廃・清掃提案
        if ($customerData['uses_industrial'] && !$customerData['uses_general']) {
            $suggestions[] = [
                'target' => '産廃利用企業',
                'proposal' => '事務所の一般廃棄物も一括管理でコスト削減',
                'benefit' => '窓口一本化、請求書削減、管理工数削減'
            ];
        }
        
        // 清掃利用企業への廃棄物サービス提案
        if ($customerData['uses_cleaning'] && !$customerData['uses_waste']) {
            $suggestions[] = [
                'target' => '清掃サービス利用企業',
                'proposal' => '清掃時に発生する廃棄物の適正処理',
                'benefit' => '作業の一貫性、コンプライアンス確保'
            ];
        }
        
        return $suggestions;
    }
}
```

### 3. 業界KPIダッシュボード
```php
// 重要指標の可視化
$industryKPIs = [
    '全社' => [
        '総売上高',
        '部門別構成比',
        '新規顧客獲得数',
        '既存顧客離脱率'
    ],
    '産業廃棄物' => [
        '処理量（トン）',
        'トン当たり売上',
        '施設稼働率',
        'マニフェスト発行数'
    ],
    '一般廃棄物' => [
        '定期回収契約数',
        'ルート効率（km/件）',
        '月額契約単価',
        'クレーム発生率'
    ],
    '清掃サービス' => [
        '月間施工件数',
        '平均単価',
        'リピート率',
        '見積→受注率'
    ]
];
```

## 戦略的アドバイス例

### 1. 部門バランス最適化
- 「産廃部門の売上比率が70%を超えています。景気変動リスクを分散するため、安定収入が見込める一般廃棄物の契約を増やしましょう」

### 2. クロスセル推進
- 「産廃のみ利用の大口顧客A社は、従業員500名の事業所です。一般廃棄物と定期清掃サービスの提案により、月額20万円の追加売上が見込めます」

### 3. 季節戦略
- 「清掃部門は例年3-4月に需要が急増します。2月中に既存顧客への早期予約案内を行い、スケジュール確保と売上の平準化を図りましょう」

### 4. 価格戦略
- 「競合他社の産廃処理単価値下げに対し、マニフェスト電子化サービスや緊急対応保証などの付加価値で差別化し、価格競争を回避しましょう」

## 実装優先順位

1. **第1段階（必須）**
   - 部門別の売上・利益管理
   - 基本的なKPI算出
   - 顧客の利用サービス管理

2. **第2段階（重要）**
   - クロスセル機会の可視化
   - 部門別の戦略提案
   - 業界特有指標の追跡

3. **第3段階（発展）**
   - 車両・施設の稼働最適化
   - 法規制変更への対応提案
   - 地域別市場分析