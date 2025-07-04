<?php
session_start();

// セッションIDが無い場合は新規作成
if (!isset($_SESSION['session_id'])) {
    $_SESSION['session_id'] = uniqid('bio_', true);
    $_SESSION['started_at'] = date('Y-m-d H:i:s');
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>経営者自伝作成システム</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card shadow">
                    <div class="card-body p-5">
                        <h1 class="text-center mb-4">経営者自伝作成システム</h1>
                        <p class="lead text-center mb-5">
                            あなたの人生の物語を、体系的な質問を通じて紡ぎ出します。<br>
                            廃棄物処理・水回りメンテナンス業界で歩んできた道のりを、<br>
                            次世代に伝える自伝として残しましょう。
                        </p>
                        
                        <div class="mb-4">
                            <h5>このシステムの特徴</h5>
                            <ul>
                                <li>6つのカテゴリー（幼少期〜現在・未来）に分けた体系的な質問</li>
                                <li>回答は自動保存されるため、いつでも中断・再開が可能</li>
                                <li>回答内容に基づいて追加の質問が生成されます</li>
                                <li>最終的に本格的な自伝原稿として出力されます</li>
                            </ul>
                        </div>
                        
                        <div class="d-grid gap-3">
                            <a href="question.php" class="btn btn-primary btn-lg">
                                質問に回答を始める
                            </a>
                            <a href="progress.php" class="btn btn-outline-secondary">
                                進捗状況を確認する
                            </a>
                            <div class="row g-2">
                                <div class="col-6">
                                    <a href="admin.php" class="btn btn-outline-info btn-sm w-100">
                                        管理画面
                                    </a>
                                </div>
                                <div class="col-6">
                                    <a href="restore_backup.php" class="btn btn-outline-success btn-sm w-100">
                                        データ復元
                                    </a>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-5 text-center text-muted">
                            <small>セッションID: <?php echo $_SESSION['session_id']; ?></small><br>
                            <small>開始日時: <?php echo $_SESSION['started_at']; ?></small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/app.js"></script>
</body>
</html>