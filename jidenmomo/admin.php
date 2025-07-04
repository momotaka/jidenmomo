<?php
session_start();

// セッションチェック
if (!isset($_SESSION['session_id'])) {
    header('Location: index.php');
    exit;
}

// データの読み込み
$questions_data = json_decode(file_get_contents('data/questions.json'), true);
$questions = $questions_data['questions'];
$categories = $questions_data['categories'];

$answers_data = json_decode(file_get_contents('data/answers.json'), true);
$answers = $answers_data['answers'] ?? [];

// 統計情報の計算
$total_questions = count($questions);
$total_answered = 0;
$total_characters = 0;
$category_stats = [];

foreach ($categories as $cat_id => $cat) {
    $category_stats[$cat_id] = [
        'name' => $cat['name'],
        'total' => 0,
        'answered' => 0,
        'characters' => 0
    ];
}

foreach ($questions as $question) {
    $cat_id = $question['category'];
    $category_stats[$cat_id]['total']++;
    
    if (isset($answers[$question['id']]) && !empty($answers[$question['id']]['answer'])) {
        $total_answered++;
        $category_stats[$cat_id]['answered']++;
        $char_count = $answers[$question['id']]['character_count'] ?? 0;
        $total_characters += $char_count;
        $category_stats[$cat_id]['characters'] += $char_count;
    }
}

$completion_rate = $total_questions > 0 ? round($total_answered / $total_questions * 100) : 0;
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理画面 - 経営者自伝作成システム</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container">
            <a class="navbar-brand" href="index.php">経営者自伝作成システム</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="question.php">質問に戻る</a>
                <a class="nav-link" href="progress.php">進捗確認</a>
            </div>
        </div>
    </nav>

    <div class="container py-5">
        <h2 class="mb-4">管理画面</h2>
        
        <!-- 統計情報 -->
        <div class="row mb-4">
            <div class="col-md-3 mb-3">
                <div class="card stat-card">
                    <div class="card-body text-center">
                        <h6 class="card-title">完了率</h6>
                        <div class="stat-number"><?php echo $completion_rate; ?>%</div>
                        <small><?php echo $total_answered; ?> / <?php echo $total_questions; ?> 問</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stat-card">
                    <div class="card-body text-center">
                        <h6 class="card-title">総文字数</h6>
                        <div class="stat-number"><?php echo number_format($total_characters); ?></div>
                        <small>文字</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stat-card">
                    <div class="card-body text-center">
                        <h6 class="card-title">平均文字数</h6>
                        <div class="stat-number">
                            <?php echo $total_answered > 0 ? number_format($total_characters / $total_answered) : 0; ?>
                        </div>
                        <small>文字/回答</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stat-card">
                    <div class="card-body text-center">
                        <h6 class="card-title">推定ページ数</h6>
                        <div class="stat-number">
                            <?php echo round($total_characters / 400); ?>
                        </div>
                        <small>ページ（400字/頁）</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- カテゴリー別進捗グラフ -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">カテゴリー別回答状況</h5>
                        <div class="chart-container">
                            <canvas id="categoryChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">カテゴリー別統計</h5>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>カテゴリー</th>
                                        <th>回答済み</th>
                                        <th>文字数</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($category_stats as $cat_id => $stat): ?>
                                    <tr>
                                        <td><?php echo $stat['name']; ?></td>
                                        <td>
                                            <?php echo $stat['answered']; ?> / <?php echo $stat['total']; ?>
                                            <small>(<?php echo $stat['total'] > 0 ? round($stat['answered'] / $stat['total'] * 100) : 0; ?>%)</small>
                                        </td>
                                        <td><?php echo number_format($stat['characters']); ?></td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- データ操作 -->
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">データ操作</h5>
                <div class="d-grid gap-2">
                    <div class="btn-group" role="group">
                        <button class="btn btn-primary" onclick="exportData('json')">
                            <i class="bi bi-download"></i> JSONエクスポート
                        </button>
                        <button class="btn btn-success" onclick="exportData('csv')">
                            <i class="bi bi-file-earmark-spreadsheet"></i> CSVエクスポート
                        </button>
                    </div>
                    <div class="btn-group" role="group">
                        <a href="restore_backup.php" class="btn btn-info">
                            <i class="bi bi-upload"></i> バックアップから復元
                        </a>
                        <button class="btn btn-warning" onclick="if(confirm('すべての回答データをクリアしますか？')) clearAllData()">
                            <i class="bi bi-trash"></i> データクリア
                        </button>
                    </div>
                </div>
                <div class="mt-2 text-muted">
                    <small>※ CSVファイルがある場合は「バックアップから復元」でインポートできます</small>
                </div>
            </div>
        </div>

        <!-- 回答一覧 -->
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">回答一覧</h5>
                <div class="accordion" id="answersAccordion">
                    <?php foreach ($questions as $idx => $question): 
                        $answer_data = $answers[$question['id']] ?? null;
                        $has_answer = $answer_data && !empty($answer_data['answer']);
                    ?>
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading<?php echo $idx; ?>">
                            <button class="accordion-button collapsed" type="button" 
                                    data-bs-toggle="collapse" data-bs-target="#collapse<?php echo $idx; ?>">
                                <div class="d-flex align-items-center w-100">
                                    <span class="badge bg-secondary me-2">
                                        <?php echo $categories[$question['category']]['name']; ?>
                                    </span>
                                    <span class="me-auto">
                                        <?php echo htmlspecialchars(mb_substr($question['question'], 0, 50)); ?>...
                                    </span>
                                    <?php if ($has_answer): ?>
                                        <span class="badge bg-success me-2">回答済み</span>
                                        <small class="text-muted"><?php echo $answer_data['character_count']; ?>文字</small>
                                    <?php else: ?>
                                        <span class="badge bg-warning">未回答</span>
                                    <?php endif; ?>
                                </div>
                            </button>
                        </h2>
                        <div id="collapse<?php echo $idx; ?>" class="accordion-collapse collapse" 
                             data-bs-parent="#answersAccordion">
                            <div class="accordion-body">
                                <p class="fw-bold"><?php echo htmlspecialchars($question['question']); ?></p>
                                <?php if ($has_answer): ?>
                                    <div class="bg-light p-3 rounded">
                                        <pre class="mb-0" style="white-space: pre-wrap;"><?php echo htmlspecialchars($answer_data['answer']); ?></pre>
                                    </div>
                                    <div class="mt-2 text-muted">
                                        <small>最終更新: <?php echo $answer_data['updated_at']; ?></small>
                                    </div>
                                <?php else: ?>
                                    <p class="text-muted">（未回答）</p>
                                <?php endif; ?>
                                <div class="mt-2">
                                    <a href="question.php?q=<?php echo $idx; ?>" class="btn btn-sm btn-primary">
                                        編集する
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/app.js"></script>
    <script>
        // カテゴリー別グラフの描画
        const ctx = document.getElementById('categoryChart').getContext('2d');
        const categoryData = <?php echo json_encode($category_stats); ?>;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.values(categoryData).map(cat => cat.name),
                datasets: [{
                    label: '回答済み',
                    data: Object.values(categoryData).map(cat => cat.answered),
                    backgroundColor: '#3498db'
                }, {
                    label: '未回答',
                    data: Object.values(categoryData).map(cat => cat.total - cat.answered),
                    backgroundColor: '#ecf0f1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true }
                }
            }
        });
        
        // データクリア関数
        function clearAllData() {
            fetch('api.php?action=clear', { method: 'POST' })
                .then(() => location.reload())
                .catch(error => alert('エラー: ' + error.message));
        }
    </script>
</body>
</html>