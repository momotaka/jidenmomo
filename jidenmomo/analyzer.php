<?php
session_start();

// データファイルの読み込み
$questions_data = json_decode(file_get_contents('data/questions.json'), true);
$answers_data = json_decode(file_get_contents('data/answers.json'), true);

// CSVファイルから回答データを読み込む（存在する場合）
$csv_files = glob('data/*.csv');
if (!empty($csv_files)) {
    $latest_csv = end($csv_files);
    $csv_data = array_map('str_getcsv', file($latest_csv));
    
    // CSVヘッダーをスキップして、回答データを統合
    foreach ($csv_data as $index => $row) {
        if ($index === 0) continue; // ヘッダー行をスキップ
        if (count($row) >= 6 && !empty($row[3])) { // 回答がある場合
            $question_id = $row[0];
            $answers_data['answers'][$question_id] = [
                'answer' => $row[3],
                'character_count' => intval($row[4]),
                'updated_at' => $row[5]
            ];
        }
    }
}

// 分析結果を格納する配列
$analysis = [
    'created_at' => date('Y-m-d H:i:s'),
    'total_questions' => count($questions_data['questions']),
    'answered_questions' => 0,
    'total_characters' => 0,
    'category_analysis' => [],
    'short_answers' => [],
    'key_persons' => [],
    'key_events' => [],
    'emotional_expressions' => [],
    'interesting_episodes' => [],
    'needs_elaboration' => []
];

// カテゴリー別の分析を初期化
foreach ($questions_data['categories'] as $cat_id => $category) {
    $analysis['category_analysis'][$cat_id] = [
        'name' => $category['name'],
        'total_questions' => 0,
        'answered_questions' => 0,
        'total_characters' => 0,
        'avg_characters' => 0,
        'completion_rate' => 0
    ];
}

// 重要なキーワードパターン
$person_patterns = ['父', '母', '祖父', '祖母', '姉', '妹', '兄', '弟', '親父', 'おやじ', 'じいちゃん', 'ばあちゃん'];
$emotion_patterns = ['嬉しい', '悲しい', '怖い', '楽しい', '辛い', '苦しい', '幸せ', '感動', '感謝', '後悔', '誇り'];
$event_patterns = ['初めて', '転機', '決断', '挑戦', '失敗', '成功', '危機', '震災', '事故', '出会い'];

// 各質問と回答を分析
foreach ($questions_data['questions'] as $question) {
    $q_id = $question['id'];
    $cat_id = $question['category'];
    
    // カテゴリー統計を更新
    $analysis['category_analysis'][$cat_id]['total_questions']++;
    
    if (isset($answers_data['answers'][$q_id]) && !empty($answers_data['answers'][$q_id]['answer'])) {
        $answer = $answers_data['answers'][$q_id];
        $answer_text = $answer['answer'];
        $char_count = mb_strlen($answer_text);
        
        $analysis['answered_questions']++;
        $analysis['total_characters'] += $char_count;
        $analysis['category_analysis'][$cat_id]['answered_questions']++;
        $analysis['category_analysis'][$cat_id]['total_characters'] += $char_count;
        
        // 短い回答の検出（200文字未満）
        if ($char_count < 200) {
            $analysis['short_answers'][] = [
                'question_id' => $q_id,
                'question' => $question['question'],
                'answer_length' => $char_count,
                'category' => $cat_id
            ];
        }
        
        // キーワード抽出
        // 人物
        foreach ($person_patterns as $pattern) {
            if (mb_strpos($answer_text, $pattern) !== false) {
                if (!in_array($pattern, $analysis['key_persons'])) {
                    $analysis['key_persons'][] = $pattern;
                }
            }
        }
        
        // 感情表現
        foreach ($emotion_patterns as $pattern) {
            if (mb_strpos($answer_text, $pattern) !== false) {
                $analysis['emotional_expressions'][] = [
                    'question_id' => $q_id,
                    'emotion' => $pattern,
                    'context' => mb_substr($answer_text, max(0, mb_strpos($answer_text, $pattern) - 20), 50)
                ];
            }
        }
        
        // 重要な出来事
        foreach ($event_patterns as $pattern) {
            if (mb_strpos($answer_text, $pattern) !== false) {
                $analysis['key_events'][] = [
                    'question_id' => $q_id,
                    'event' => $pattern,
                    'context' => mb_substr($answer_text, max(0, mb_strpos($answer_text, $pattern) - 20), 50)
                ];
            }
        }
        
        // 興味深いエピソードの検出（具体的な固有名詞や数字を含む）
        if (preg_match('/\d{4}年/', $answer_text) || 
            preg_match('/[0-9]+[万円|円|名|人]/', $answer_text) ||
            mb_strpos($answer_text, '新潟') !== false ||
            mb_strpos($answer_text, '震災') !== false) {
            $analysis['interesting_episodes'][] = [
                'question_id' => $q_id,
                'category' => $cat_id,
                'snippet' => mb_substr($answer_text, 0, 100) . '...'
            ];
        }
    }
}

// カテゴリー別の平均文字数と完了率を計算
foreach ($analysis['category_analysis'] as $cat_id => &$cat_stats) {
    if ($cat_stats['answered_questions'] > 0) {
        $cat_stats['avg_characters'] = round($cat_stats['total_characters'] / $cat_stats['answered_questions']);
    }
    if ($cat_stats['total_questions'] > 0) {
        $cat_stats['completion_rate'] = round($cat_stats['answered_questions'] / $cat_stats['total_questions'] * 100);
    }
}

// 詳細化が必要な項目を特定
foreach ($analysis['short_answers'] as $short) {
    if ($questions_data['questions'][array_search($short['question_id'], array_column($questions_data['questions'], 'id'))]['required']) {
        $analysis['needs_elaboration'][] = [
            'question_id' => $short['question_id'],
            'current_length' => $short['answer_length'],
            'recommended_length' => 300,
            'reason' => '必須質問の回答が短すぎます'
        ];
    }
}

// 分析結果を保存
file_put_contents('data/analysis.json', json_encode($analysis, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// HTMLレポートの生成
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>回答分析レポート - 経営者自伝作成システム</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container">
            <a class="navbar-brand" href="index.php">経営者自伝作成システム</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="admin.php">管理画面</a>
                <a class="nav-link" href="generate_questions.php">追加質問生成</a>
            </div>
        </div>
    </nav>

    <div class="container py-5">
        <h2 class="mb-4">回答分析レポート</h2>
        
        <!-- サマリー -->
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">全体サマリー</h5>
                <div class="row">
                    <div class="col-md-3">
                        <p><strong>回答済み:</strong> <?php echo $analysis['answered_questions']; ?> / <?php echo $analysis['total_questions']; ?> 問</p>
                    </div>
                    <div class="col-md-3">
                        <p><strong>総文字数:</strong> <?php echo number_format($analysis['total_characters']); ?> 文字</p>
                    </div>
                    <div class="col-md-3">
                        <p><strong>平均文字数:</strong> <?php echo $analysis['answered_questions'] > 0 ? round($analysis['total_characters'] / $analysis['answered_questions']) : 0; ?> 文字</p>
                    </div>
                    <div class="col-md-3">
                        <p><strong>完了率:</strong> <?php echo $analysis['answered_questions'] > 0 ? round($analysis['answered_questions'] / $analysis['total_questions'] * 100) : 0; ?>%</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- カテゴリー別分析 -->
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">カテゴリー別分析</h5>
                <table class="table">
                    <thead>
                        <tr>
                            <th>カテゴリー</th>
                            <th>回答状況</th>
                            <th>完了率</th>
                            <th>平均文字数</th>
                            <th>推奨アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($analysis['category_analysis'] as $cat_id => $stats): ?>
                        <tr>
                            <td><?php echo $stats['name']; ?></td>
                            <td><?php echo $stats['answered_questions']; ?> / <?php echo $stats['total_questions']; ?></td>
                            <td>
                                <div class="progress" style="width: 100px;">
                                    <div class="progress-bar" style="width: <?php echo $stats['completion_rate']; ?>%"></div>
                                </div>
                                <?php echo $stats['completion_rate']; ?>%
                            </td>
                            <td><?php echo $stats['avg_characters']; ?> 文字</td>
                            <td>
                                <?php if ($stats['completion_rate'] < 50): ?>
                                    <span class="badge bg-danger">要回答</span>
                                <?php elseif ($stats['avg_characters'] < 200): ?>
                                    <span class="badge bg-warning">詳細化推奨</span>
                                <?php else: ?>
                                    <span class="badge bg-success">良好</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 検出されたキーワード -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">登場人物</h5>
                        <?php if (!empty($analysis['key_persons'])): ?>
                            <?php foreach ($analysis['key_persons'] as $person): ?>
                                <span class="badge bg-primary m-1"><?php echo $person; ?></span>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <p class="text-muted">まだ検出されていません</p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">重要な出来事</h5>
                        <?php if (!empty($analysis['key_events'])): ?>
                            <?php foreach (array_unique(array_column($analysis['key_events'], 'event')) as $event): ?>
                                <span class="badge bg-info m-1"><?php echo $event; ?></span>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <p class="text-muted">まだ検出されていません</p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">感情表現</h5>
                        <?php if (!empty($analysis['emotional_expressions'])): ?>
                            <?php foreach (array_unique(array_column($analysis['emotional_expressions'], 'emotion')) as $emotion): ?>
                                <span class="badge bg-success m-1"><?php echo $emotion; ?></span>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <p class="text-muted">まだ検出されていません</p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- 改善推奨事項 -->
        <?php if (!empty($analysis['needs_elaboration'])): ?>
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">詳細化が推奨される回答</h5>
                <ul>
                    <?php foreach ($analysis['needs_elaboration'] as $item): ?>
                        <li>質問ID: <?php echo $item['question_id']; ?> - <?php echo $item['reason']; ?> (現在: <?php echo $item['current_length']; ?>文字)</li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </div>
        <?php endif; ?>

        <!-- アクションボタン -->
        <div class="d-flex gap-2">
            <a href="generate_questions.php" class="btn btn-primary">追加質問を生成</a>
            <a href="admin.php" class="btn btn-secondary">管理画面に戻る</a>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>