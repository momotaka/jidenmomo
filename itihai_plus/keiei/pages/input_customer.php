<?php
require_once '../includes/auth.php';
require_once '../includes/db.php';
require_once '../includes/functions.php';

// ログインチェック
Auth::requireLogin();

$db = Database::getInstance();
$errors = [];

// タブ切り替え
$activeTab = $_GET['tab'] ?? 'customers';

// 顧客登録処理
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'add_customer') {
        // 顧客情報登録
        $customerName = sanitizeInput($_POST['customer_name'] ?? '');
        $customerType = $_POST['customer_type'] ?? '';
        $industryType = sanitizeInput($_POST['industry_type'] ?? '');
        $monthlyVolume = $_POST['monthly_volume'] ?? '';
        $creditLimit = $_POST['credit_limit'] ?? '';
        $paymentTerms = $_POST['payment_terms'] ?? '';
        
        // バリデーション
        if (empty($customerName)) {
            $errors[] = '顧客名を入力してください。';
        }
        if (empty($customerType)) {
            $errors[] = '顧客種別を選択してください。';
        }
        
        if (empty($errors)) {
            try {
                $data = [
                    'customer_name' => $customerName,
                    'customer_type' => $customerType,
                    'primary_department' => 'general_waste',
                    'industry_type' => $industryType,
                    'monthly_volume' => $monthlyVolume ?: null,
                    'credit_limit' => $creditLimit ?: null,
                    'payment_terms' => $paymentTerms ?: null
                ];
                
                $db->insert('keiei_customers', $data);
                setFlashMessage('顧客を登録しました。', 'success');
                redirect('/keiei/pages/input_customer.php');
                
            } catch (Exception $e) {
                $errors[] = '顧客の登録中にエラーが発生しました。';
            }
        }
        
    } elseif ($_POST['action'] === 'add_feedback') {
        // フィードバック登録
        $customerId = $_POST['customer_id'] ?? '';
        $feedbackDate = $_POST['feedback_date'] ?? '';
        $feedbackText = sanitizeInput($_POST['feedback_text'] ?? '');
        $category = sanitizeInput($_POST['category'] ?? '');
        $priority = $_POST['priority'] ?? '';
        
        // バリデーション
        if (empty($customerId)) {
            $errors[] = '顧客を選択してください。';
        }
        if (empty($feedbackDate)) {
            $errors[] = 'フィードバック日を入力してください。';
        }
        if (empty($feedbackText)) {
            $errors[] = 'フィードバック内容を入力してください。';
        }
        
        if (empty($errors)) {
            try {
                $data = [
                    'customer_id' => $customerId,
                    'feedback_date' => $feedbackDate,
                    'feedback_text' => $feedbackText,
                    'category' => $category,
                    'priority' => $priority
                ];
                
                $db->insert('keiei_customer_feedback', $data);
                setFlashMessage('フィードバックを登録しました。', 'success');
                redirect('/keiei/pages/input_customer.php?tab=feedback');
                
            } catch (Exception $e) {
                $errors[] = 'フィードバックの登録中にエラーが発生しました。';
            }
        }
        $activeTab = 'feedback';
    }
}

// 顧客一覧取得
$sql = "SELECT 
            c.*,
            COUNT(DISTINCT ds.id) as transaction_count,
            SUM(ds.total_sales) as total_sales
        FROM keiei_customers c
        LEFT JOIN keiei_department_sales ds ON c.id = ds.customer_id 
            AND ds.department = 'general_waste'
        WHERE c.primary_department = 'general_waste' OR c.primary_department IS NULL
        GROUP BY c.id
        ORDER BY c.customer_name";
$customers = $db->fetchAll($sql);

// フィードバック一覧取得
$sql = "SELECT 
            cf.*,
            c.customer_name
        FROM keiei_customer_feedback cf
        JOIN keiei_customers c ON cf.customer_id = c.id
        WHERE c.primary_department = 'general_waste' OR c.primary_department IS NULL
        ORDER BY cf.feedback_date DESC, cf.id DESC
        LIMIT 20";
$feedbacks = $db->fetchAll($sql);

// 業種リスト（一般廃棄物向け）
$industryTypes = [
    '飲食業' => '飲食業',
    '小売業' => '小売業',
    'オフィスビル' => 'オフィスビル',
    '医療機関' => '医療機関',
    '教育機関' => '教育機関',
    'マンション・アパート' => 'マンション・アパート',
    '公共施設' => '公共施設',
    'その他' => 'その他'
];

// フィードバックカテゴリ
$feedbackCategories = [
    'collection_time' => '収集時間',
    'collection_quality' => '収集品質',
    'response' => '対応',
    'price' => '価格',
    'contract' => '契約内容',
    'other' => 'その他'
];
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>顧客管理 - <?php echo SYSTEM_NAME; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
    <link href="<?php echo ASSETS_PATH; ?>/css/style.css" rel="stylesheet">
</head>
<body>
    <!-- ナビゲーションバー -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-success">
        <div class="container-fluid">
            <a class="navbar-brand" href="/keiei/dashboard.php">
                <i class="bi bi-recycle"></i><?php echo SYSTEM_NAME; ?>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            <i class="bi bi-person-circle"></i> <?php echo h(Auth::getUsername()); ?>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="/keiei/logout.php">
                                <i class="bi bi-box-arrow-right"></i> ログアウト
                            </a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid">
        <div class="row">
            <!-- サイドバー -->
            <nav class="col-md-3 col-lg-2 d-md-block bg-light sidebar">
                <div class="position-sticky">
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link" href="/keiei/dashboard.php">
                                <i class="bi bi-speedometer2"></i>ダッシュボード
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/keiei/pages/input_sales.php">
                                <i class="bi bi-cash-coin"></i>売上データ入力
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link active" href="/keiei/pages/input_customer.php">
                                <i class="bi bi-people"></i>顧客管理
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/keiei/pages/analysis.php">
                                <i class="bi bi-graph-up"></i>収益性分析
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/keiei/pages/strategy.php">
                                <i class="bi bi-lightbulb"></i>戦略提案
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/keiei/pages/report.php">
                                <i class="bi bi-file-earmark-pdf"></i>レポート
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>

            <!-- メインコンテンツ -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">顧客管理</h1>
                </div>

                <?php echo getFlashMessage(); ?>

                <?php if (!empty($errors)): ?>
                    <div class="alert alert-danger">
                        <ul class="mb-0">
                            <?php foreach ($errors as $error): ?>
                                <li><?php echo h($error); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>

                <!-- タブナビゲーション -->
                <ul class="nav nav-tabs mb-4" role="tablist">
                    <li class="nav-item" role="presentation">
                        <a class="nav-link <?php echo $activeTab === 'customers' ? 'active' : ''; ?>" 
                           href="?tab=customers" role="tab">
                            <i class="bi bi-building"></i> 顧客一覧
                        </a>
                    </li>
                    <li class="nav-item" role="presentation">
                        <a class="nav-link <?php echo $activeTab === 'feedback' ? 'active' : ''; ?>" 
                           href="?tab=feedback" role="tab">
                            <i class="bi bi-chat-dots"></i> フィードバック
                        </a>
                    </li>
                </ul>

                <!-- タブコンテンツ -->
                <div class="tab-content">
                    <!-- 顧客一覧タブ -->
                    <?php if ($activeTab === 'customers'): ?>
                    <div class="tab-pane fade show active">
                        <!-- 新規顧客登録 -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <i class="bi bi-plus-circle"></i> 新規顧客登録
                            </div>
                            <div class="card-body">
                                <form method="post" action="">
                                    <input type="hidden" name="action" value="add_customer">
                                    <div class="row">
                                        <div class="col-md-4 mb-3">
                                            <label for="customer_name" class="form-label">顧客名 <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control" id="customer_name" name="customer_name" required>
                                        </div>
                                        <div class="col-md-2 mb-3">
                                            <label for="customer_type" class="form-label">顧客種別 <span class="text-danger">*</span></label>
                                            <select class="form-select" id="customer_type" name="customer_type" required>
                                                <option value="">選択</option>
                                                <?php echo generateSelectOptions(CUSTOMER_TYPES, ''); ?>
                                            </select>
                                        </div>
                                        <div class="col-md-3 mb-3">
                                            <label for="industry_type" class="form-label">業種</label>
                                            <select class="form-select" id="industry_type" name="industry_type">
                                                <option value="">選択してください</option>
                                                <?php echo generateSelectOptions($industryTypes, ''); ?>
                                            </select>
                                        </div>
                                        <div class="col-md-3 mb-3">
                                            <label for="monthly_volume" class="form-label">月間取扱量目安(t)</label>
                                            <input type="number" class="form-control" id="monthly_volume" name="monthly_volume" 
                                                   step="0.1" min="0">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-4 mb-3">
                                            <label for="credit_limit" class="form-label">与信限度額</label>
                                            <div class="input-group">
                                                <span class="input-group-text">¥</span>
                                                <input type="number" class="form-control" id="credit_limit" name="credit_limit" 
                                                       step="1000" min="0">
                                            </div>
                                        </div>
                                        <div class="col-md-2 mb-3">
                                            <label for="payment_terms" class="form-label">支払サイト(日)</label>
                                            <input type="number" class="form-control" id="payment_terms" name="payment_terms" 
                                                   min="0" max="180" placeholder="30">
                                        </div>
                                        <div class="col-md-6 mb-3 d-flex align-items-end">
                                            <button type="submit" class="btn btn-primary">
                                                <i class="bi bi-save"></i> 登録
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <!-- 顧客一覧 -->
                        <div class="card">
                            <div class="card-header">
                                <i class="bi bi-list"></i> 顧客一覧
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>顧客名</th>
                                                <th>種別</th>
                                                <th>業種</th>
                                                <th class="text-end">月間取扱量</th>
                                                <th class="text-end">取引回数</th>
                                                <th class="text-end">累計売上</th>
                                                <th>状態</th>
                                                <th>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php foreach ($customers as $customer): ?>
                                            <tr>
                                                <td><?php echo h($customer['customer_name']); ?></td>
                                                <td><?php echo getCustomerTypeName($customer['customer_type']); ?></td>
                                                <td><?php echo h($customer['industry_type'] ?: '-'); ?></td>
                                                <td class="text-end">
                                                    <?php echo $customer['monthly_volume'] ? formatNumber($customer['monthly_volume'], 1) . 't' : '-'; ?>
                                                </td>
                                                <td class="text-end"><?php echo $customer['transaction_count']; ?>回</td>
                                                <td class="text-end"><?php echo formatCurrency($customer['total_sales'] ?: 0); ?></td>
                                                <td>
                                                    <span class="badge bg-<?php 
                                                        echo $customer['contract_status'] === 'active' ? 'success' : 
                                                            ($customer['contract_status'] === 'inactive' ? 'secondary' : 'info'); 
                                                    ?>">
                                                        <?php 
                                                        $statusLabels = ['active' => '取引中', 'inactive' => '休止', 'prospect' => '見込'];
                                                        echo $statusLabels[$customer['contract_status']] ?? $customer['contract_status'];
                                                        ?>
                                                    </span>
                                                </td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-primary" 
                                                            onclick="alert('顧客詳細画面は実装予定です')">
                                                        <i class="bi bi-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            <?php endforeach; ?>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- フィードバックタブ -->
                    <?php if ($activeTab === 'feedback'): ?>
                    <div class="tab-pane fade show active">
                        <!-- フィードバック登録 -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <i class="bi bi-plus-circle"></i> フィードバック登録
                            </div>
                            <div class="card-body">
                                <form method="post" action="">
                                    <input type="hidden" name="action" value="add_feedback">
                                    <div class="row">
                                        <div class="col-md-4 mb-3">
                                            <label for="customer_id" class="form-label">顧客 <span class="text-danger">*</span></label>
                                            <select class="form-select" id="customer_id" name="customer_id" required>
                                                <option value="">選択してください</option>
                                                <?php foreach ($customers as $customer): ?>
                                                    <option value="<?php echo $customer['id']; ?>">
                                                        <?php echo h($customer['customer_name']); ?>
                                                    </option>
                                                <?php endforeach; ?>
                                            </select>
                                        </div>
                                        <div class="col-md-3 mb-3">
                                            <label for="feedback_date" class="form-label">日付 <span class="text-danger">*</span></label>
                                            <input type="date" class="form-control" id="feedback_date" name="feedback_date" 
                                                   value="<?php echo date('Y-m-d'); ?>" required>
                                        </div>
                                        <div class="col-md-3 mb-3">
                                            <label for="category" class="form-label">カテゴリ</label>
                                            <select class="form-select" id="category" name="category">
                                                <option value="">選択してください</option>
                                                <?php echo generateSelectOptions($feedbackCategories, ''); ?>
                                            </select>
                                        </div>
                                        <div class="col-md-2 mb-3">
                                            <label for="priority" class="form-label">優先度</label>
                                            <select class="form-select" id="priority" name="priority">
                                                <?php echo generateSelectOptions(PRIORITY_LEVELS, 'medium'); ?>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-12 mb-3">
                                            <label for="feedback_text" class="form-label">内容 <span class="text-danger">*</span></label>
                                            <textarea class="form-control" id="feedback_text" name="feedback_text" 
                                                      rows="3" required></textarea>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-save"></i> 登録
                                    </button>
                                </form>
                            </div>
                        </div>

                        <!-- フィードバック一覧 -->
                        <div class="card">
                            <div class="card-header">
                                <i class="bi bi-list"></i> フィードバック一覧
                            </div>
                            <div class="card-body">
                                <?php if (empty($feedbacks)): ?>
                                    <p class="text-muted">フィードバックがありません。</p>
                                <?php else: ?>
                                    <div class="table-responsive">
                                        <table class="table">
                                            <thead>
                                                <tr>
                                                    <th>日付</th>
                                                    <th>顧客名</th>
                                                    <th>カテゴリ</th>
                                                    <th>内容</th>
                                                    <th>優先度</th>
                                                    <th>状態</th>
                                                    <th>操作</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <?php foreach ($feedbacks as $feedback): ?>
                                                <tr>
                                                    <td><?php echo formatDate($feedback['feedback_date'], 'Y/m/d'); ?></td>
                                                    <td><?php echo h($feedback['customer_name']); ?></td>
                                                    <td><?php echo h($feedbackCategories[$feedback['category']] ?? $feedback['category'] ?: '-'); ?></td>
                                                    <td><?php echo h(mb_strimwidth($feedback['feedback_text'], 0, 80, '...')); ?></td>
                                                    <td>
                                                        <span class="badge bg-<?php 
                                                            echo $feedback['priority'] === 'high' ? 'danger' : 
                                                                ($feedback['priority'] === 'medium' ? 'warning' : 'secondary'); 
                                                        ?>">
                                                            <?php echo getPriorityName($feedback['priority']); ?>
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span class="badge bg-<?php 
                                                            echo $feedback['status'] === 'resolved' ? 'success' : 
                                                                ($feedback['status'] === 'in_progress' ? 'primary' : 'secondary'); 
                                                        ?>">
                                                            <?php echo getFeedbackStatusName($feedback['status']); ?>
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-primary" 
                                                                onclick="alert('フィードバック詳細は実装予定です')">
                                                            <i class="bi bi-eye"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                                <?php endforeach; ?>
                                            </tbody>
                                        </table>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>
            </main>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="<?php echo ASSETS_PATH; ?>/js/main.js"></script>
</body>
</html>