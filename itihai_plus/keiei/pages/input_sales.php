<?php
require_once '../includes/auth.php';
require_once '../includes/db.php';
require_once '../includes/functions.php';

// ログインチェック
Auth::requireLogin();

$db = Database::getInstance();
$errors = [];
$success = false;

// 顧客リスト取得（一般廃棄物部門の顧客）
$sql = "SELECT id, customer_name FROM keiei_customers 
        WHERE contract_status = 'active' 
        AND (primary_department = 'general_waste' OR primary_department IS NULL)
        ORDER BY customer_name";
$customers = $db->fetchAll($sql);

// フォーム送信処理
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 入力値取得
    $salesDate = $_POST['sales_date'] ?? '';
    $customerId = $_POST['customer_id'] ?? '';
    $serviceType = $_POST['service_type'] ?? '';
    $contractType = $_POST['contract_type'] ?? '';
    $quantity = $_POST['quantity'] ?? '';
    $unitPrice = $_POST['unit_price'] ?? '';
    $directCost = $_POST['direct_cost'] ?? '';
    
    // バリデーション
    if (empty($salesDate)) {
        $errors[] = '売上日を入力してください。';
    }
    if (empty($customerId)) {
        $errors[] = '顧客を選択してください。';
    }
    if (empty($serviceType)) {
        $errors[] = 'サービス種別を選択してください。';
    }
    if (empty($contractType)) {
        $errors[] = '契約形態を選択してください。';
    }
    if (!is_numeric($quantity) || $quantity <= 0) {
        $errors[] = '数量は正の数値で入力してください。';
    }
    if (!is_numeric($unitPrice) || $unitPrice <= 0) {
        $errors[] = '単価は正の数値で入力してください。';
    }
    if (!is_numeric($directCost) || $directCost < 0) {
        $errors[] = '直接原価は0以上の数値で入力してください。';
    }
    
    // エラーがなければ保存
    if (empty($errors)) {
        try {
            $totalSales = $quantity * $unitPrice;
            
            $data = [
                'department' => 'general_waste',
                'sales_date' => $salesDate,
                'customer_id' => $customerId,
                'service_type' => $serviceType,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_sales' => $totalSales,
                'direct_cost' => $directCost,
                'contract_type' => $contractType
            ];
            
            $db->insert('keiei_department_sales', $data);
            
            setFlashMessage('売上データを登録しました。', 'success');
            redirect('/keiei/pages/input_sales.php');
            
        } catch (Exception $e) {
            $errors[] = 'データの保存中にエラーが発生しました。';
        }
    }
}

// 最近の売上データ取得
$sql = "SELECT 
            ds.id,
            ds.sales_date,
            ds.service_type,
            ds.quantity,
            ds.unit_price,
            ds.total_sales,
            ds.direct_cost,
            ds.gross_profit,
            ds.contract_type,
            c.customer_name
        FROM keiei_department_sales ds
        LEFT JOIN keiei_customers c ON ds.customer_id = c.id
        WHERE ds.department = 'general_waste'
        ORDER BY ds.sales_date DESC, ds.id DESC
        LIMIT 10";
$recentSales = $db->fetchAll($sql);

// 一般廃棄物のサービス種別
$serviceTypes = [
    'regular_collection' => '定期回収',
    'spot_collection' => 'スポット回収',
    'container_rental' => 'コンテナレンタル',
    'extra_collection' => '臨時回収',
    'bulky_waste' => '粗大ごみ処理'
];
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>売上データ入力（一般廃棄物） - <?php echo SYSTEM_NAME; ?></title>
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
                            <a class="nav-link active" href="/keiei/pages/input_sales.php">
                                <i class="bi bi-cash-coin"></i>売上データ入力
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/keiei/pages/input_customer.php">
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
                    <h1 class="h2">売上データ入力（一般廃棄物）</h1>
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

                <!-- 入力フォーム -->
                <div class="card mb-4">
                    <div class="card-header">
                        <i class="bi bi-plus-circle"></i> 新規売上データ登録
                    </div>
                    <div class="card-body">
                        <form method="post" action="" class="needs-validation" novalidate>
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label for="sales_date" class="form-label">売上日 <span class="text-danger">*</span></label>
                                    <input type="date" class="form-control" id="sales_date" name="sales_date" 
                                           value="<?php echo h($_POST['sales_date'] ?? date('Y-m-d')); ?>" required>
                                </div>
                                
                                <div class="col-md-4 mb-3">
                                    <label for="customer_id" class="form-label">顧客 <span class="text-danger">*</span></label>
                                    <select class="form-select" id="customer_id" name="customer_id" required>
                                        <option value="">選択してください</option>
                                        <?php foreach ($customers as $customer): ?>
                                            <option value="<?php echo $customer['id']; ?>" 
                                                    <?php echo ($_POST['customer_id'] ?? '') == $customer['id'] ? 'selected' : ''; ?>>
                                                <?php echo h($customer['customer_name']); ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                
                                <div class="col-md-4 mb-3">
                                    <label for="contract_type" class="form-label">契約形態 <span class="text-danger">*</span></label>
                                    <select class="form-select" id="contract_type" name="contract_type" required>
                                        <option value="">選択してください</option>
                                        <?php echo generateSelectOptions(CONTRACT_TYPES, $_POST['contract_type'] ?? ''); ?>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label for="service_type" class="form-label">サービス種別 <span class="text-danger">*</span></label>
                                    <select class="form-select" id="service_type" name="service_type" required>
                                        <option value="">選択してください</option>
                                        <?php echo generateSelectOptions($serviceTypes, $_POST['service_type'] ?? ''); ?>
                                    </select>
                                </div>
                                
                                <div class="col-md-2 mb-3">
                                    <label for="quantity" class="form-label">数量 <span class="text-danger">*</span></label>
                                    <input type="number" class="form-control" id="quantity" name="quantity" 
                                           value="<?php echo h($_POST['quantity'] ?? ''); ?>" 
                                           step="0.01" min="0.01" required>
                                    <small class="text-muted">回数または重量(t)</small>
                                </div>
                                
                                <div class="col-md-3 mb-3">
                                    <label for="unit_price" class="form-label">単価 <span class="text-danger">*</span></label>
                                    <div class="input-group">
                                        <span class="input-group-text">¥</span>
                                        <input type="number" class="form-control" id="unit_price" name="unit_price" 
                                               value="<?php echo h($_POST['unit_price'] ?? ''); ?>" 
                                               step="0.01" min="0" required>
                                    </div>
                                </div>
                                
                                <div class="col-md-3 mb-3">
                                    <label for="direct_cost" class="form-label">直接原価 <span class="text-danger">*</span></label>
                                    <div class="input-group">
                                        <span class="input-group-text">¥</span>
                                        <input type="number" class="form-control" id="direct_cost" name="direct_cost" 
                                               value="<?php echo h($_POST['direct_cost'] ?? ''); ?>" 
                                               step="0.01" min="0" required>
                                    </div>
                                    <small class="text-muted">処理費、人件費、燃料費など</small>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-12">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-save"></i> 登録
                                    </button>
                                    <button type="reset" class="btn btn-secondary">
                                        <i class="bi bi-x-circle"></i> クリア
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- 最近の売上データ -->
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-clock-history"></i> 最近の売上データ
                    </div>
                    <div class="card-body">
                        <?php if (empty($recentSales)): ?>
                            <p class="text-muted">売上データがありません。</p>
                        <?php else: ?>
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>売上日</th>
                                            <th>顧客名</th>
                                            <th>サービス</th>
                                            <th>契約</th>
                                            <th class="text-end">数量</th>
                                            <th class="text-end">単価</th>
                                            <th class="text-end">売上高</th>
                                            <th class="text-end">原価</th>
                                            <th class="text-end">粗利益</th>
                                            <th class="text-end">粗利率</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($recentSales as $sale): ?>
                                        <tr>
                                            <td><?php echo formatDate($sale['sales_date'], 'Y/m/d'); ?></td>
                                            <td><?php echo h($sale['customer_name']); ?></td>
                                            <td><?php echo h($serviceTypes[$sale['service_type']] ?? $sale['service_type']); ?></td>
                                            <td>
                                                <span class="badge bg-secondary">
                                                    <?php echo getContractTypeName($sale['contract_type']); ?>
                                                </span>
                                            </td>
                                            <td class="text-end"><?php echo formatNumber($sale['quantity'], 2); ?></td>
                                            <td class="text-end"><?php echo formatCurrency($sale['unit_price']); ?></td>
                                            <td class="text-end"><?php echo formatCurrency($sale['total_sales']); ?></td>
                                            <td class="text-end"><?php echo formatCurrency($sale['direct_cost']); ?></td>
                                            <td class="text-end"><?php echo formatCurrency($sale['gross_profit']); ?></td>
                                            <td class="text-end">
                                                <?php 
                                                $marginRate = calculateGrossMargin($sale['total_sales'], $sale['direct_cost']);
                                                $colorClass = $marginRate < 20 ? 'text-danger' : ($marginRate < 30 ? 'text-warning' : 'text-success');
                                                ?>
                                                <span class="<?php echo $colorClass; ?>">
                                                    <?php echo formatNumber($marginRate, 1); ?>%
                                                </span>
                                            </td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="<?php echo ASSETS_PATH; ?>/js/main.js"></script>
    <script>
        // 売上高自動計算
        document.addEventListener('DOMContentLoaded', function() {
            const quantityInput = document.getElementById('quantity');
            const unitPriceInput = document.getElementById('unit_price');
            
            function calculateTotal() {
                const quantity = parseFloat(quantityInput.value) || 0;
                const unitPrice = parseFloat(unitPriceInput.value) || 0;
                const total = quantity * unitPrice;
                
                // 計算結果を表示（必要に応じて）
                console.log('売上高: ¥' + total.toLocaleString('ja-JP'));
            }
            
            quantityInput.addEventListener('input', calculateTotal);
            unitPriceInput.addEventListener('input', calculateTotal);
        });
    </script>
</body>
</html>