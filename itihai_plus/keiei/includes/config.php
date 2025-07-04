<?php
// システム設定ファイル

// エラー表示設定（開発環境では有効、本番環境では無効にする）
error_reporting(E_ALL);
ini_set('display_errors', 1);

// タイムゾーン設定
date_default_timezone_set('Asia/Tokyo');

// データベース設定
define('DB_HOST', 'localhost');
define('DB_NAME', 'keiei_system');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// セッション設定
define('SESSION_NAME', 'KEIEI_SESSION');
define('SESSION_LIFETIME', 7200); // 2時間

// システム設定
define('SYSTEM_NAME', '廃棄物処理業 経営戦略支援システム');
define('SYSTEM_VERSION', '1.0.0');

// ディレクトリパス
define('ROOT_PATH', dirname(__DIR__));
define('INCLUDES_PATH', ROOT_PATH . '/includes');
define('PAGES_PATH', ROOT_PATH . '/pages');
define('ASSETS_PATH', '/keiei/assets');

// 部門定義
define('DEPARTMENTS', [
    'industrial_waste' => '産業廃棄物',
    'general_waste' => '一般廃棄物',
    'cleaning' => '清掃サービス'
]);

// 契約タイプ定義
define('CONTRACT_TYPES', [
    'spot' => 'スポット',
    'regular' => '定期',
    'long_term' => '長期契約'
]);

// 顧客タイプ定義
define('CUSTOMER_TYPES', [
    'corporate' => '法人',
    'individual' => '個人',
    'government' => '官公庁'
]);

// 優先度定義
define('PRIORITY_LEVELS', [
    'high' => '高',
    'medium' => '中',
    'low' => '低'
]);

// ステータス定義
define('FEEDBACK_STATUS', [
    'new' => '新規',
    'in_progress' => '対応中',
    'resolved' => '解決済'
]);

// クロスセルステータス
define('CROSS_SELL_STATUS', [
    'identified' => '機会特定',
    'approached' => 'アプローチ中',
    'converted' => '成約',
    'declined' => '見送り'
]);