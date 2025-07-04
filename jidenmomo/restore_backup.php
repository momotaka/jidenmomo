<?php
session_start();

// CSVファイルからanswers.jsonを復元
if (isset($_POST['restore'])) {
    $csv_file = $_POST['csv_file'] ?? '';
    if (file_exists($csv_file)) {
        $csv_data = array_map('str_getcsv', file($csv_file));
        
        $answers_data = [
            'session_id' => $_SESSION['session_id'] ?? '',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
            'answers' => []
        ];
        
        foreach ($csv_data as $index => $row) {
            if ($index === 0) continue; // ヘッダースキップ
            if (count($row) >= 6 && !empty($row[3])) {
                $answers_data['answers'][$row[0]] = [
                    'answer' => $row[3],
                    'character_count' => intval($row[4]),
                    'updated_at' => $row[5]
                ];
            }
        }
        
        // バックアップを作成してから上書き
        if (file_exists('data/answers.json')) {
            copy('data/answers.json', 'data/answers_backup_' . date('Ymd_His') . '.json');
        }
        
        file_put_contents('data/answers.json', json_encode($answers_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $message = 'CSVファイルから復元しました';
    } else {
        $message = 'CSVファイルが見つかりません';
    }
}

// 利用可能なCSVファイル一覧
$csv_files = glob('data/*.csv');
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>バックアップ復元 - 経営者自伝作成システム</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container">
            <a class="navbar-brand" href="index.php">経営者自伝作成システム</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="admin.php">管理画面</a>
            </div>
        </div>
    </nav>

    <div class="container py-5">
        <h2 class="mb-4">バックアップからの復元</h2>
        
        <?php if (isset($message)): ?>
        <div class="alert alert-info"><?php echo $message; ?></div>
        <?php endif; ?>
        
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">利用可能なバックアップファイル</h5>
                
                <?php if (empty($csv_files)): ?>
                    <p class="text-muted">バックアップファイルがありません</p>
                <?php else: ?>
                    <form method="POST">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>ファイル名</th>
                                        <th>作成日時</th>
                                        <th>サイズ</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($csv_files as $file): ?>
                                    <tr>
                                        <td><?php echo basename($file); ?></td>
                                        <td><?php echo date('Y-m-d H:i:s', filemtime($file)); ?></td>
                                        <td><?php echo number_format(filesize($file)); ?> bytes</td>
                                        <td>
                                            <button type="submit" name="restore" value="1" class="btn btn-sm btn-primary"
                                                    onclick="return confirm('このファイルから復元しますか？')">
                                                復元
                                            </button>
                                            <input type="hidden" name="csv_file" value="<?php echo $file; ?>">
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </form>
                <?php endif; ?>
                
                <div class="mt-4">
                    <h6>注意事項：</h6>
                    <ul>
                        <li>復元を実行すると、現在のデータは上書きされます</li>
                        <li>復元前に自動的にバックアップが作成されます</li>
                        <li>CSVファイルから復元する場合、セッションIDは現在のものが使用されます</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="mt-3">
            <a href="admin.php" class="btn btn-secondary">管理画面に戻る</a>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>