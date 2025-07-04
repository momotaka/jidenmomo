<?php
require_once 'includes/auth.php';
require_once 'includes/db.php';
require_once 'includes/functions.php';

// ログインチェック
Auth::requireLogin();

$db = Database::getInstance();
$userId = Auth::getUserId();

// 現在の月の範囲を取得
$currentMonth = date('Y-m');
$monthRange = getMonthRange($currentMonth);

// 部門別売上データ取得
$sql = "SELECT 
            department,
            COUNT(DISTINCT customer_id) as customer_count,
            SUM(total_sales) as total_sales,
            SUM(direct_cost) as total_cost,
            SUM(gross_profit) as gross_profit,
            AVG((gross_profit / total_sales) * 100) as avg_margin_rate
        FROM keiei_department_sales
        WHERE sales_date BETWEEN :start_date AND :end_date
        GROUP BY department";

$departmentStats = $db->fetchAll($sql, [
    'start_date' => $monthRange['start'],
    'end_date' => $monthRange['end']
]);

// 部門別データを整形
$deptData = [
    'industrial_waste' => ['customer_count' => 0, 'total_sales' => 0, 'gross_profit' => 0, 'avg_margin_rate' => 0],
    'general_waste' => ['customer_count' => 0, 'total_sales' => 0, 'gross_profit' => 0, 'avg_margin_rate' => 0],
    'cleaning' => ['customer_count' => 0, 'total_sales' => 0, 'gross_profit' => 0, 'avg_margin_rate' => 0]
];

foreach ($departmentStats as $stat) {
    $deptData[$stat['department']] = $stat;
}

// 全社合計
$totalSales = array_sum(array_column($deptData, 'total_sales'));
$totalProfit = array_sum(array_column($deptData, 'gross_profit'));
$totalMarginRate = $totalSales > 0 ? ($totalProfit / $totalSales) * 100 : 0;

// 最近の顧客フィードバック
$sql = "SELECT 
            cf.id,
            cf.feedback_date,
            cf.feedback_text,
            cf.priority,
            cf.status,
            c.customer_name
        FROM keiei_customer_feedback cf
        JOIN keiei_customers c ON cf.customer_id = c.id
        ORDER BY cf.feedback_date DESC
        LIMIT 5";

$recentFeedback = $db->fetchAll($sql);

// クロスセル機会
$sql = "SELECT 
            COUNT(*) as opportunity_count,
            COUNT(CASE WHEN status = 'identified' THEN 1 END) as new_opportunities
        FROM keiei_cross_sell_opportunities
        WHERE status IN ('identified', 'approached')";

$crossSellStats = $db->fetchOne($sql);
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ダッシュボード - <?php echo SYSTEM_NAME; ?></title>
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
                            <a class="nav-link active" href="/keiei/dashboard.php">
                                <i class="bi bi-speedometer2"></i>ダッシュボード
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/keiei/pages/input_sales.php">
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
                    <h1 class="h2">ダッシュボード</h1>
                    <div class="btn-toolbar mb-2 mb-md-0">
                        <span class="text-muted"><?php echo date('Y年m月'); ?></span>
                    </div>
                </div>

                <?php echo getFlashMessage(); ?>

                <!-- 全社サマリー -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card stat-card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <div class="stat-value"><?php echo formatCurrency($totalSales); ?></div>
                                        <div class="stat-label">総売上高</div>
                                    </div>
                                    <div class="stat-icon text-primary">
                                        <i class="bi bi-currency-yen"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card stat-card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <div class="stat-value"><?php echo formatCurrency($totalProfit); ?></div>
                                        <div class="stat-label">粗利益</div>
                                    </div>
                                    <div class="stat-icon text-success">
                                        <i class="bi bi-graph-up-arrow"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card stat-card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <div class="stat-value"><?php echo formatNumber($totalMarginRate, 1); ?>%</div>
                                        <div class="stat-label">粗利率</div>
                                    </div>
                                    <div class="stat-icon text-info">
                                        <i class="bi bi-percent"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card stat-card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <div class="stat-value"><?php echo $crossSellStats['new_opportunities'] ?? 0; ?></div>
                                        <div class="stat-label">新規クロスセル機会</div>
                                    </div>
                                    <div class="stat-icon text-warning">
                                        <i class="bi bi-arrow-left-right"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 部門別実績 -->
                <div class="card mb-4">
                    <div class="card-header">
                        <i class="bi bi-building"></i> 部門別実績
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>部門</th>
                                        <th class="text-end">顧客数</th>
                                        <th class="text-end">売上高</th>
                                        <th class="text-end">粗利益</th>
                                        <th class="text-end">粗利率</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($deptData as $dept => $data): ?>
                                    <tr>
                                        <td>
                                            <span class="badge badge-<?php echo $dept; ?>">
                                                <?php echo getDepartmentName($dept); ?>
                                            </span>
                                        </td>
                                        <td class="text-end"><?php echo $data['customer_count']; ?>社</td>
                                        <td class="text-end"><?php echo formatCurrency($data['total_sales']); ?></td>
                                        <td class="text-end"><?php echo formatCurrency($data['gross_profit']); ?></td>
                                        <td class="text-end"><?php echo formatNumber($data['avg_margin_rate'], 1); ?>%</td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                                <tfoot>
                                    <tr class="fw-bold">
                                        <td>合計</td>
                                        <td class="text-end">-</td>
                                        <td class="text-end"><?php echo formatCurrency($totalSales); ?></td>
                                        <td class="text-end"><?php echo formatCurrency($totalProfit); ?></td>
                                        <td class="text-end"><?php echo formatNumber($totalMarginRate, 1); ?>%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 最近の顧客フィードバック -->
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-chat-dots"></i> 最近の顧客フィードバック
                    </div>
                    <div class="card-body">
                        <?php if (empty($recentFeedback)): ?>
                            <p class="text-muted">フィードバックはありません。</p>
                        <?php else: ?>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>日付</th>
                                            <th>顧客名</th>
                                            <th>内容</th>
                                            <th>優先度</th>
                                            <th>状態</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($recentFeedback as $feedback): ?>
                                        <tr>
                                            <td><?php echo formatDate($feedback['feedback_date'], 'm/d'); ?></td>
                                            <td><?php echo h($feedback['customer_name']); ?></td>
                                            <td><?php echo h(mb_strimwidth($feedback['feedback_text'], 0, 50, '...')); ?></td>
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
</body>
</html>