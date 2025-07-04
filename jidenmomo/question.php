<?php
session_start();

// セッションチェック
if (!isset($_SESSION['session_id'])) {
    header('Location: index.php');
    exit;
}

// 質問データの読み込み
$questions_data = json_decode(file_get_contents('data/questions.json'), true);
$questions = $questions_data['questions'];
$categories = $questions_data['categories'];

// 現在の質問インデックス
$current_index = isset($_GET['q']) ? intval($_GET['q']) : 0;
if ($current_index < 0) $current_index = 0;
if ($current_index >= count($questions)) $current_index = count($questions) - 1;

$current_question = $questions[$current_index];
$total_questions = count($questions);

// 回答データの読み込み
$answers_file = 'data/answers.json';
$answers_data = json_decode(file_get_contents($answers_file), true);

// セッションIDの初期設定（既存データは保持）
if (empty($answers_data['session_id'])) {
    $answers_data['session_id'] = $_SESSION['session_id'];
    $answers_data['created_at'] = date('Y-m-d H:i:s');
}

// 現在の回答を取得
$current_answer = isset($answers_data['answers'][$current_question['id']]) 
    ? $answers_data['answers'][$current_question['id']]['answer'] 
    : '';
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>質問回答 - 経営者自伝作成システム</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container">
            <a class="navbar-brand" href="index.php">経営者自伝作成システム</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="progress.php">進捗確認</a>
                <a class="nav-link" href="admin.php">管理画面</a>
            </div>
        </div>
    </nav>

    <div class="container-fluid py-3 py-md-5">
        <div class="row justify-content-center">
            <div class="col-12 col-md-11 col-lg-10">
                <!-- 進捗バー -->
                <div class="mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>質問 <?php echo $current_index + 1; ?> / <?php echo $total_questions; ?></span>
                        <span><?php echo round(($current_index + 1) / $total_questions * 100); ?>%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" 
                             style="width: <?php echo (($current_index + 1) / $total_questions * 100); ?>%">
                        </div>
                    </div>
                </div>

                <!-- 質問カード -->
                <div class="card shadow">
                    <div class="card-header">
                        <span class="badge bg-primary">
                            <?php echo $categories[$current_question['category']]['name']; ?>
                        </span>
                        <?php if ($current_question['required']): ?>
                            <span class="badge bg-danger ms-2">必須</span>
                        <?php else: ?>
                            <span class="badge bg-secondary ms-2">任意</span>
                        <?php endif; ?>
                    </div>
                    <div class="card-body p-4">
                        <h5 class="card-title mb-4">
                            <?php echo htmlspecialchars($current_question['question']); ?>
                        </h5>
                        
                        <form id="answerForm">
                            <input type="hidden" id="questionId" value="<?php echo $current_question['id']; ?>">
                            <input type="hidden" id="questionIndex" value="<?php echo $current_index; ?>">
                            
                            <div class="mb-4">
                                <textarea class="form-control" id="answer" rows="30" 
                                          placeholder="ここに回答を入力してください..."
                                          style="min-height: 600px; font-size: 18px; line-height: 2.0;"><?php echo htmlspecialchars($current_answer); ?></textarea>
                                <div class="form-text">
                                    回答は自動的に保存されます。じっくりと思い出しながら、具体的なエピソードを交えて記入してください。
                                </div>
                            </div>
                            
                            <div id="saveStatus" class="alert d-none"></div>
                        </form>
                    </div>
                    <div class="card-footer">
                        <div class="d-flex justify-content-between">
                            <a href="?q=<?php echo $current_index - 1; ?>" 
                               class="btn btn-outline-secondary <?php echo $current_index == 0 ? 'disabled' : ''; ?>">
                                ← 前の質問
                            </a>
                            
                            <?php if ($current_index < $total_questions - 1): ?>
                                <a href="?q=<?php echo $current_index + 1; ?>" class="btn btn-primary">
                                    次の質問 →
                                </a>
                            <?php else: ?>
                                <a href="progress.php" class="btn btn-success">
                                    進捗を確認する
                                </a>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <!-- カテゴリー別ジャンプ -->
                <div class="mt-4">
                    <h6>カテゴリー別にジャンプ:</h6>
                    <div class="btn-group flex-wrap" role="group">
                        <?php 
                        $category_first_index = [];
                        foreach ($questions as $idx => $q) {
                            if (!isset($category_first_index[$q['category']])) {
                                $category_first_index[$q['category']] = $idx;
                            }
                        }
                        foreach ($categories as $cat_id => $cat): 
                            if (isset($category_first_index[$cat_id])):
                        ?>
                            <a href="?q=<?php echo $category_first_index[$cat_id]; ?>" 
                               class="btn btn-sm btn-outline-primary m-1">
                                <?php echo $cat['name']; ?>
                            </a>
                        <?php 
                            endif;
                        endforeach; 
                        ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/app.js"></script>
</body>
</html>