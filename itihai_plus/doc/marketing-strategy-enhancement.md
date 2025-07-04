# マーケティング戦略機能の強化案

## 追加すべき分析機能

### 1. ABC分析
```sql
-- 商品別売上構成比を計算し、A/B/Cランクに分類
CREATE TABLE keiei_abc_analysis (
    product_name VARCHAR(100),
    sales_amount DECIMAL(12,2),
    sales_ratio DECIMAL(5,2),
    cumulative_ratio DECIMAL(5,2),
    rank CHAR(1)  -- A:累積70%まで、B:70-90%、C:90-100%
);
```

### 2. RFM分析
```sql
-- 顧客価値を3軸で評価
CREATE TABLE keiei_rfm_analysis (
    customer_id INT,
    recency_score INT,      -- 最終購買日からの経過日数
    frequency_score INT,    -- 購買頻度
    monetary_score INT,     -- 購買金額
    customer_segment VARCHAR(50)  -- 優良顧客、新規顧客、離反顧客など
);
```

### 3. 季節性分析
```sql
-- 月別・四半期別の売上傾向
CREATE TABLE keiei_seasonal_patterns (
    product_name VARCHAR(100),
    month INT,
    avg_sales DECIMAL(12,2),
    seasonal_index DECIMAL(5,2)  -- 平均を100とした指数
);
```

## 強化版戦略提案エンジン

```php
class AdvancedStrategyEngine {
    
    // マーケティング戦略のパターン定義
    private $strategies = [
        'price_strategies' => [
            'penetration' => ['条件' => '新商品・市場シェア拡大期', 'アクション' => '競合より低価格設定'],
            'skimming' => ['条件' => '革新的商品・初期需要獲得', 'アクション' => '高価格からの段階的引き下げ'],
            'competitive' => ['条件' => '成熟市場・差別化困難', 'アクション' => '競合価格に追随'],
            'value' => ['条件' => '高付加価値・ブランド力', 'アクション' => 'プレミアム価格維持']
        ],
        
        'promotion_strategies' => [
            'push' => ['条件' => 'B2B・流通重視', 'アクション' => '販売店インセンティブ強化'],
            'pull' => ['条件' => 'B2C・ブランド認知', 'アクション' => '消費者向け広告・PR強化'],
            'seasonal' => ['条件' => '季節商品', 'アクション' => 'タイミング重視のキャンペーン']
        ],
        
        'customer_strategies' => [
            'retention' => ['条件' => '既存顧客の離反防止', 'アクション' => 'ロイヤリティプログラム導入'],
            'acquisition' => ['条件' => '新規顧客獲得', 'アクション' => '初回購入特典・お試し価格'],
            'winback' => ['条件' => '休眠顧客の掘り起こし', 'アクション' => '限定オファー・再購入促進']
        ]
    ];
    
    // 分析結果に基づく戦略提案
    public function generateStrategicAdvice($data) {
        $advice = [];
        
        // 1. ABC分析に基づく商品戦略
        if ($data['abc_analysis']) {
            $advice['product_strategy'] = $this->getProductStrategy($data['abc_analysis']);
        }
        
        // 2. RFM分析に基づく顧客戦略
        if ($data['rfm_analysis']) {
            $advice['customer_strategy'] = $this->getCustomerStrategy($data['rfm_analysis']);
        }
        
        // 3. 収益性に基づく価格戦略
        if ($data['profitability']) {
            $advice['price_strategy'] = $this->getPriceStrategy($data['profitability']);
        }
        
        // 4. 季節性に基づくプロモーション戦略
        if ($data['seasonality']) {
            $advice['promotion_timing'] = $this->getSeasonalStrategy($data['seasonality']);
        }
        
        // 5. 総合的な戦略提案
        $advice['integrated_strategy'] = $this->integrateStrategies($advice);
        
        return $advice;
    }
    
    // 商品戦略の具体的提案
    private function getProductStrategy($abcData) {
        $strategies = [];
        
        // Aランク商品（売上の70%を占める主力商品）
        $strategies['A_rank'] = [
            '在庫切れ防止を最優先',
            '品質管理の徹底',
            '価格競争力の維持',
            'クロスセル商品の開発'
        ];
        
        // Bランク商品（売上の20%）
        $strategies['B_rank'] = [
            'Aランクへの育成候補を選定',
            'プロモーション強化で認知度向上',
            'バンドル販売での価値提供'
        ];
        
        // Cランク商品（売上の10%）
        $strategies['C_rank'] = [
            '廃番候補の検討',
            '在庫圧縮',
            'ニッチ市場への特化'
        ];
        
        return $strategies;
    }
    
    // 顧客セグメント別戦略
    private function getCustomerStrategy($rfmData) {
        $segments = [
            'champions' => [
                'セグメント' => '優良顧客（RFM全て高）',
                'アクション' => [
                    'VIP特典の提供',
                    '新商品の優先案内',
                    'パーソナライズドサービス'
                ]
            ],
            'at_risk' => [
                'セグメント' => '離反リスク顧客（R低、FM高）',
                'アクション' => [
                    '特別オファーで再活性化',
                    '離反理由のヒアリング',
                    '代替商品の提案'
                ]
            ],
            'new_customers' => [
                'セグメント' => '新規顧客（R高、FM低）',
                'アクション' => [
                    '2回目購入の促進',
                    '商品理解を深めるコンテンツ提供',
                    '初回購入感謝特典'
                ]
            ]
        ];
        
        return $segments;
    }
    
    // 対話型の市場情報収集
    public function collectMarketIntelligence() {
        return [
            '競合情報' => [
                '主要競合の価格帯は？',
                '競合の新商品・キャンペーン情報は？',
                '競合と比較した自社の強み・弱みは？'
            ],
            '市場環境' => [
                '業界全体の成長率は？',
                '規制や法改正の影響は？',
                '技術革新による変化は？'
            ],
            '顧客インサイト' => [
                '最近の顧客からの要望で多いものは？',
                '顧客の購買行動に変化は？',
                'SNSでの評判はどうか？'
            ]
        ];
    }
}
```

## データベース追加テーブル

```sql
-- 競合情報（手動入力）
CREATE TABLE keiei_competitors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    competitor_name VARCHAR(100),
    product_category VARCHAR(50),
    price_range VARCHAR(50),
    market_share DECIMAL(5,2),
    strengths TEXT,
    weaknesses TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- マーケティング目標設定
CREATE TABLE keiei_marketing_goals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    goal_type VARCHAR(50),  -- 売上向上、シェア拡大、顧客獲得など
    target_value DECIMAL(12,2),
    current_value DECIMAL(12,2),
    deadline DATE,
    priority INT,
    status VARCHAR(20)
);

-- 施策実行履歴
CREATE TABLE keiei_action_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action_type VARCHAR(50),
    action_detail TEXT,
    implemented_date DATE,
    result TEXT,
    effectiveness_score INT  -- 1-5の評価
);
```

## 実装の優先順位

1. **第1段階（必須）**
   - ABC分析機能
   - 基本的な収益性分析の強化
   - 顧客セグメント分析（簡易版）

2. **第2段階（推奨）**
   - RFM分析
   - 季節性分析
   - 競合比較機能

3. **第3段階（将来拡張）**
   - 予測分析
   - What-ifシミュレーション
   - 機械学習による最適化

これらの機能を追加することで、月2回の利用でも実践的で価値のある戦略アドバイスが可能になります。