<?php
session_start();

// データファイルの読み込み
$questions_data = json_decode(file_get_contents('data/questions.json'), true);
$categories = $questions_data['categories'];

// CSVファイルから最新の回答データを読み込む
$csv_files = glob('data/*.csv');
$answers_data = [];
$csv_filename = '';

if (!empty($csv_files)) {
    $latest_csv = end($csv_files);
    $csv_filename = basename($latest_csv);
    $csv_data = array_map('str_getcsv', file($latest_csv));
    
    foreach ($csv_data as $index => $row) {
        if ($index === 0) continue;
        if (count($row) >= 6) {
            $answers_data[$row[0]] = [
                'category' => $row[1],
                'question' => $row[2],
                'answer' => $row[3],
                'character_count' => intval($row[4]),
                'updated_at' => $row[5]
            ];
        }
    }
}

// カテゴリー別にデータを整理
$organized_data = [];
foreach ($categories as $cat_id => $category) {
    $organized_data[$cat_id] = [
        'name' => $category['name'],
        'description' => $category['description'],
        'questions' => []
    ];
}

foreach ($questions_data['questions'] as $question) {
    $q_id = $question['id'];
    $cat_id = $question['category'];
    
    $organized_data[$cat_id]['questions'][] = [
        'id' => $q_id,
        'question' => $question['question'],
        'required' => $question['required'],
        'answer' => $answers_data[$q_id]['answer'] ?? '',
        'character_count' => $answers_data[$q_id]['character_count'] ?? 0,
        'updated_at' => $answers_data[$q_id]['updated_at'] ?? ''
    ];
}

// Claude Code用のテキスト出力を生成
$output_text = "# 経営者自伝 回答データ\n\n";
$output_text .= "生成日時: " . date('Y-m-d H:i:s') . "\n";
$output_text .= "データソース: " . $csv_filename . "\n\n";

foreach ($organized_data as $cat_id => $category) {
    $output_text .= "## " . $category['name'] . "\n";
    $output_text .= $category['description'] . "\n\n";
    
    foreach ($category['questions'] as $q) {
        if (!empty($q['answer'])) {
            $output_text .= "### " . $q['question'] . "\n";
            $output_text .= "回答（" . $q['character_count'] . "文字）:\n";
            $output_text .= $q['answer'] . "\n\n";
        }
    }
}

// 章別データ出力の準備
$chapter_data = [
    'childhood' => [
        'title' => '第1章：原点 - 新潟の大家族で育った少年時代',
        'questions' => []
    ],
    'youth' => [
        'title' => '第2章：青春 - 科学者を夢見た学生時代',
        'questions' => []
    ],
    'early_career' => [
        'title' => '第3章：社会人 - ビジネスの世界への第一歩',
        'questions' => []
    ],
    'entrepreneurship' => [
        'title' => '第4章：起業 - ゼロからの挑戦',
        'questions' => []
    ],
    'growth' => [
        'title' => '第5章：成長 - 組織づくりと事業拡大',
        'questions' => []
    ],
    'present_future' => [
        'title' => '第6章：未来 - 次世代への継承',
        'questions' => []
    ]
];

// 章別にデータを振り分け
foreach ($organized_data as $cat_id => $category) {
    if (isset($chapter_data[$cat_id])) {
        $chapter_data[$cat_id]['questions'] = $category['questions'];
    }
}

?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>データ確認・整理 - 経営者自伝作成システム</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container">
            <a class="navbar-brand" href="index.php">経営者自伝作成システム</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="analyzer.php">分析結果</a>
                <a class="nav-link" href="admin.php">管理画面</a>
            </div>
        </div>
    </nav>

    <div class="container py-5">
        <h2 class="mb-4">データ確認・整理</h2>
        
        <!-- データソース情報 -->
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">データソース情報</h5>
                <p><strong>使用ファイル:</strong> <?php echo $csv_filename; ?></p>
                <p><strong>総回答数:</strong> <?php echo count(array_filter($answers_data, function($a) { return !empty($a['answer']); })); ?> 件</p>
                <p><strong>総文字数:</strong> <?php echo number_format(array_sum(array_column($answers_data, 'character_count'))); ?> 文字</p>
            </div>
        </div>

        <!-- カテゴリー別データ表示 -->
        <div class="accordion mb-4" id="dataAccordion">
            <?php foreach ($organized_data as $cat_id => $category): ?>
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading_<?php echo $cat_id; ?>">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                            data-bs-target="#collapse_<?php echo $cat_id; ?>">
                        <?php echo $category['name']; ?> 
                        <span class="badge bg-info ms-2">
                            <?php 
                            $answered = count(array_filter($category['questions'], function($q) { return !empty($q['answer']); }));
                            echo $answered . ' / ' . count($category['questions']) . ' 回答';
                            ?>
                        </span>
                    </button>
                </h2>
                <div id="collapse_<?php echo $cat_id; ?>" class="accordion-collapse collapse" 
                     data-bs-parent="#dataAccordion">
                    <div class="accordion-body">
                        <?php foreach ($category['questions'] as $q): ?>
                        <div class="mb-3 p-3 <?php echo empty($q['answer']) ? 'bg-light' : 'bg-white border'; ?>">
                            <h6><?php echo htmlspecialchars($q['question']); ?></h6>
                            <?php if (!empty($q['answer'])): ?>
                                <p class="mb-1"><?php echo nl2br(htmlspecialchars($q['answer'])); ?></p>
                                <small class="text-muted">
                                    文字数: <?php echo $q['character_count']; ?> | 
                                    更新: <?php echo $q['updated_at']; ?>
                                </small>
                            <?php else: ?>
                                <p class="text-muted mb-0">（未回答）</p>
                            <?php endif; ?>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>

        <!-- Claude Code用出力 -->
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">Claude Code用データ出力</h5>
                <p>以下のテキストをコピーして、Claude Codeで原稿作成時に使用してください。</p>
                <div class="mb-3">
                    <textarea class="form-control" rows="10" readonly><?php echo htmlspecialchars($output_text); ?></textarea>
                </div>
                <button class="btn btn-primary" onclick="copyToClipboard()">クリップボードにコピー</button>
                <a href="download_text.php" class="btn btn-secondary">テキストファイルでダウンロード</a>
            </div>
        </div>

        <!-- 章別プレビュー -->
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">章別構成プレビュー</h5>
                <div class="list-group">
                    <?php foreach ($chapter_data as $cat_id => $chapter): ?>
                    <div class="list-group-item">
                        <h6 class="mb-2"><?php echo $chapter['title']; ?></h6>
                        <?php 
                        $answered = count(array_filter($chapter['questions'], function($q) { return !empty($q['answer']); }));
                        $total_chars = array_sum(array_column($chapter['questions'], 'character_count'));
                        ?>
                        <div class="d-flex justify-content-between">
                            <span>回答済み: <?php echo $answered; ?> / <?php echo count($chapter['questions']); ?> 問</span>
                            <span>文字数: <?php echo number_format($total_chars); ?></span>
                        </div>
                        <?php if ($answered > 0 && $total_chars >= 500): ?>
                            <span class="badge bg-success">原稿作成可能</span>
                        <?php elseif ($answered > 0): ?>
                            <span class="badge bg-warning">データ不足（追加回答推奨）</span>
                        <?php else: ?>
                            <span class="badge bg-danger">未回答</span>
                        <?php endif; ?>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <!-- アクションボタン -->
        <div class="mt-4">
            <a href="manuscript_manager.php" class="btn btn-primary">原稿管理画面へ</a>
            <a href="admin.php" class="btn btn-secondary">管理画面に戻る</a>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function copyToClipboard() {
            const textarea = document.querySelector('textarea');
            textarea.select();
            document.execCommand('copy');
            alert('クリップボードにコピーしました');
        }
    </script>
</body>
</html>