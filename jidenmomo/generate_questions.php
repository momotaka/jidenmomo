<?php
session_start();

// データの読み込み
$questions_data = json_decode(file_get_contents('data/questions.json'), true);
$analysis_data = json_decode(file_get_contents('data/analysis.json'), true);

// CSVファイルから回答データを読み込む
$csv_files = glob('data/*.csv');
$answers_data = [];
if (!empty($csv_files)) {
    $latest_csv = end($csv_files);
    $csv_data = array_map('str_getcsv', file($latest_csv));
    
    foreach ($csv_data as $index => $row) {
        if ($index === 0) continue;
        if (count($row) >= 6 && !empty($row[3])) {
            $answers_data[$row[0]] = [
                'answer' => $row[3],
                'character_count' => intval($row[4])
            ];
        }
    }
}

// 追加質問の生成
$additional_questions = [];

// 1. 短い回答への詳細化質問
foreach ($analysis_data['short_answers'] ?? [] as $short) {
    if ($short['answer_length'] < 200) {
        $original_q = null;
        foreach ($questions_data['questions'] as $q) {
            if ($q['id'] === $short['question_id']) {
                $original_q = $q;
                break;
            }
        }
        
        if ($original_q) {
            $additional_questions[] = [
                'id' => 'aq_' . $short['question_id'] . '_detail',
                'category' => $short['category'],
                'original_question_id' => $short['question_id'],
                'question' => $original_q['question'] . "について、もう少し詳しく教えてください。具体的なエピソードや、その時の感情、周りの反応なども含めて。",
                'type' => 'elaboration',
                'required' => false
            ];
        }
    }
}

// 2. 人物に関する深掘り質問
$key_persons_in_answers = [];
foreach ($answers_data as $q_id => $answer) {
    if (mb_strpos($answer['answer'], '親父') !== false || mb_strpos($answer['answer'], '父') !== false) {
        $key_persons_in_answers['父親'] = true;
    }
    if (mb_strpos($answer['answer'], '祖父') !== false || mb_strpos($answer['answer'], 'じいちゃん') !== false) {
        $key_persons_in_answers['祖父'] = true;
    }
}

if (isset($key_persons_in_answers['父親'])) {
    $additional_questions[] = [
        'id' => 'aq_father_business',
        'category' => 'childhood',
        'question' => "お父様が社長をされていたとのことですが、どのような事業をされていましたか？また、幼少期にお父様の仕事を見て感じたことや、現在の経営に影響を与えたことがあれば教えてください。",
        'type' => 'person_detail',
        'required' => false
    ];
}

if (isset($key_persons_in_answers['祖父'])) {
    $additional_questions[] = [
        'id' => 'aq_grandfather_influence',
        'category' => 'childhood',
        'question' => "おおらかで誰からも愛されていた祖父様について、特に印象に残っているエピソードや、祖父様から受け継いだ価値観があれば教えてください。",
        'type' => 'person_detail',
        'required' => false
    ];
}

// 3. 特定のエピソードへの深掘り
if (isset($answers_data['q001']) && mb_strpos($answers_data['q001']['answer'], '新潟') !== false) {
    $additional_questions[] = [
        'id' => 'aq_niigata_influence',
        'category' => 'childhood',
        'question' => "新潟県魚沼市（旧湯之谷村）で育ったことが、現在の価値観や仕事への姿勢にどのような影響を与えていますか？雪国での生活経験から学んだことなども含めて教えてください。",
        'type' => 'location_detail',
        'required' => false
    ];
}

if (isset($answers_data['q002']) && mb_strpos($answers_data['q002']['answer'], '震災') !== false) {
    $additional_questions[] = [
        'id' => 'aq_hanshin_donation',
        'category' => 'childhood',
        'question' => "阪神淡路大震災の際にお年玉を全額寄付されたエピソードについて、当時の年齢と、なぜそのような行動を取ろうと思ったのか、ご家族の反応も含めて詳しく教えてください。この経験は現在の社会貢献活動に影響していますか？",
        'type' => 'event_detail',
        'required' => false
    ];
}

// 4. 未回答カテゴリーへのブリッジ質問
$unanswered_categories = [];
foreach ($analysis_data['category_analysis'] as $cat_id => $stats) {
    if ($stats['answered_questions'] === 0) {
        $unanswered_categories[] = $cat_id;
    }
}

if (in_array('youth', $unanswered_categories) && isset($answers_data['q002'])) {
    $additional_questions[] = [
        'id' => 'aq_bridge_to_youth',
        'category' => 'youth',
        'question' => "科学者や発明家を夢見ていた少年は、その後どのような青春時代を送ったのでしょうか？中学・高校時代の転機となった出来事があれば教えてください。",
        'type' => 'bridge',
        'required' => false
    ];
}

// 5. 家族経営の観点からの質問
if (isset($answers_data['q001']) && mb_strpos($answers_data['q001']['answer'], '親父が社長') !== false) {
    $additional_questions[] = [
        'id' => 'aq_family_business_succession',
        'category' => 'entrepreneurship',
        'question' => "お父様も経営者だったとのことですが、家業を継ぐことについてはどのように考えていましたか？また、お父様の経営スタイルから学んだこと、逆に反面教師にしたことがあれば教えてください。",
        'type' => 'family_business',
        'required' => false
    ];
}

// 質問をJSONに追加
$questions_data['additional_questions'] = $additional_questions;

// 質問生成の履歴を保存
$generation_log = [
    'generated_at' => date('Y-m-d H:i:s'),
    'total_generated' => count($additional_questions),
    'types' => array_count_values(array_column($additional_questions, 'type'))
];

?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>追加質問生成 - 経営者自伝作成システム</title>
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
        <h2 class="mb-4">追加質問の生成</h2>
        
        <!-- 生成サマリー -->
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">生成結果</h5>
                <p><strong>生成された追加質問数:</strong> <?php echo count($additional_questions); ?> 問</p>
                <div class="row">
                    <?php foreach ($generation_log['types'] as $type => $count): ?>
                    <div class="col-md-3">
                        <span class="badge bg-info"><?php echo $type; ?></span>: <?php echo $count; ?> 問
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <!-- 生成された質問一覧 -->
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">生成された追加質問</h5>
                
                <?php if (empty($additional_questions)): ?>
                    <p class="text-muted">現時点では追加質問は生成されませんでした。もう少し基本的な質問に回答してから再度お試しください。</p>
                <?php else: ?>
                    <form method="POST" action="save_additional_questions.php">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th width="50">選択</th>
                                        <th>カテゴリー</th>
                                        <th>質問</th>
                                        <th>タイプ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($additional_questions as $index => $aq): ?>
                                    <tr>
                                        <td>
                                            <input type="checkbox" name="selected_questions[]" value="<?php echo $index; ?>" checked>
                                        </td>
                                        <td>
                                            <span class="badge bg-secondary">
                                                <?php echo $questions_data['categories'][$aq['category']]['name']; ?>
                                            </span>
                                        </td>
                                        <td><?php echo htmlspecialchars($aq['question']); ?></td>
                                        <td>
                                            <span class="badge bg-info"><?php echo $aq['type']; ?></span>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="mt-4">
                            <button type="submit" class="btn btn-primary">選択した質問を追加</button>
                            <a href="admin.php" class="btn btn-secondary">管理画面に戻る</a>
                        </div>
                        
                        <!-- 追加質問データを隠しフィールドで送信 -->
                        <input type="hidden" name="additional_questions" value="<?php echo htmlspecialchars(json_encode($additional_questions)); ?>">
                    </form>
                <?php endif; ?>
            </div>
        </div>

        <!-- 生成ロジックの説明 -->
        <div class="card mt-4">
            <div class="card-body">
                <h5 class="card-title">追加質問の生成ロジック</h5>
                <ul>
                    <li><strong>詳細化 (elaboration):</strong> 200文字未満の短い回答に対して、より詳しい情報を求める質問</li>
                    <li><strong>人物詳細 (person_detail):</strong> 言及された人物についての深掘り質問</li>
                    <li><strong>出来事詳細 (event_detail):</strong> 特定の出来事やエピソードについての詳細質問</li>
                    <li><strong>地域詳細 (location_detail):</strong> 出身地や地域に関する影響についての質問</li>
                    <li><strong>ブリッジ (bridge):</strong> 未回答カテゴリーへの導入質問</li>
                    <li><strong>家業関連 (family_business):</strong> 家族経営に関する質問</li>
                </ul>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>