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

// カテゴリー別の統計を計算
$stats = [];
foreach ($categories as $cat_id => $cat) {
    $stats[$cat_id] = [
        'name' => $cat['name'],
        'total' => 0,
        'answered' => 0,
        'required_total' => 0,
        'required_answered' => 0
    ];
}

// 質問ごとの回答状況を集計
foreach ($questions as $idx => $question) {
    $cat_id = $question['category'];
    $stats[$cat_id]['total']++;
    
    if ($question['required']) {
        $stats[$cat_id]['required_total']++;
    }
    
    if (isset($answers[$question['id']]) && !empty($answers[$question['id']]['answer'])) {
        $stats[$cat_id]['answered']++;
        if ($question['required']) {
            $stats[$cat_id]['required_answered']++;
        }
    }
}

// 全体の進捗計算
$total_questions = count($questions);
$total_answered = count(array_filter($answers, function($ans) {
    return !empty($ans['answer']);
}));
$overall_progress = $total_questions > 0 ? round($total_answered / $total_questions * 100) : 0;
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>進捗確認 - 経営者自伝作成システム</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container">
            <a class="navbar-brand" href="index.php">経営者自伝作成システム</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="question.php">質問に戻る</a>
                <a class="nav-link" href="admin.php">管理画面</a>
            </div>
        </div>
    </nav>

    <div class="container py-5">
        <h2 class="mb-4">進捗状況</h2>
        
        <!-- 全体進捗 -->
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">全体の進捗</h5>
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span>回答済み: <?php echo $total_answered; ?> / <?php echo $total_questions; ?> 問</span>
                        <span class="fw-bold"><?php echo $overall_progress; ?>%</span>
                    </div>
                    <div class="progress" style="height: 25px;">
                        <div class="progress-bar bg-success" role="progressbar" 
                             style="width: <?php echo $overall_progress; ?>%">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- カテゴリー別進捗 -->
        <h4 class="mb-3">カテゴリー別進捗</h4>
        <div class="row">
            <?php foreach ($stats as $cat_id => $stat): 
                $progress = $stat['total'] > 0 ? round($stat['answered'] / $stat['total'] * 100) : 0;
            ?>
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title"><?php echo $stat['name']; ?></h6>
                        <div class="mb-2">
                            <small class="text-muted">
                                回答済み: <?php echo $stat['answered']; ?> / <?php echo $stat['total']; ?> 問
                                （必須: <?php echo $stat['required_answered']; ?> / <?php echo $stat['required_total']; ?>）
                            </small>
                        </div>
                        <div class="progress">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: <?php echo $progress; ?>%">
                                <?php echo $progress; ?>%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>

        <!-- 質問一覧 -->
        <h4 class="mb-3 mt-4">質問一覧</h4>
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th width="50">#</th>
                                <th>カテゴリー</th>
                                <th>質問</th>
                                <th width="100">状態</th>
                                <th width="100">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($questions as $idx => $question): 
                                $is_answered = isset($answers[$question['id']]) && !empty($answers[$question['id']]['answer']);
                            ?>
                            <tr>
                                <td><?php echo $idx + 1; ?></td>
                                <td>
                                    <span class="badge bg-secondary">
                                        <?php echo $categories[$question['category']]['name']; ?>
                                    </span>
                                </td>
                                <td>
                                    <?php echo htmlspecialchars($question['question']); ?>
                                    <?php if ($question['required']): ?>
                                        <span class="badge bg-danger ms-1">必須</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if ($is_answered): ?>
                                        <span class="badge bg-success">回答済み</span>
                                    <?php else: ?>
                                        <span class="badge bg-warning">未回答</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <a href="question.php?q=<?php echo $idx; ?>" class="btn btn-sm btn-primary">
                                        <?php echo $is_answered ? '編集' : '回答'; ?>
                                    </a>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- 最終更新日時 -->
        <?php if (!empty($answers_data['updated_at'])): ?>
        <div class="mt-3 text-end text-muted">
            最終更新: <?php echo $answers_data['updated_at']; ?>
        </div>
        <?php endif; ?>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>