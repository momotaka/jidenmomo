<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// セッションチェック
if (!isset($_SESSION['session_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// リクエストメソッドとアクションの取得
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// データファイルのパス
$questions_file = 'data/questions.json';
$answers_file = 'data/answers.json';
$backup_dir = 'data/backups/';

// バックアップディレクトリの作成
if (!is_dir($backup_dir)) {
    mkdir($backup_dir, 0755, true);
}

// ファイルロック機能
function safe_file_write($filename, $data) {
    $temp_file = $filename . '.tmp';
    $lock_file = $filename . '.lock';
    
    // ロックファイルでの排他制御
    $lock_handle = fopen($lock_file, 'w');
    if (!$lock_handle) {
        return false;
    }
    
    if (flock($lock_handle, LOCK_EX)) {
        // 一時ファイルに書き込み
        if (file_put_contents($temp_file, $data) !== false) {
            // 成功したら本番ファイルと置き換え
            if (rename($temp_file, $filename)) {
                flock($lock_handle, LOCK_UN);
                fclose($lock_handle);
                unlink($lock_file);
                return true;
            }
        }
        flock($lock_handle, LOCK_UN);
    }
    
    fclose($lock_handle);
    unlink($lock_file);
    return false;
}

// 自動バックアップ機能
function create_backup($filename) {
    global $backup_dir;
    if (file_exists($filename)) {
        $backup_name = basename($filename, '.json') . '_' . date('Ymd_His') . '.json';
        copy($filename, $backup_dir . $backup_name);
        
        // 古いバックアップを削除（7日以上前）
        $files = glob($backup_dir . '*.json');
        foreach ($files as $file) {
            if (filemtime($file) < strtotime('-7 days')) {
                unlink($file);
            }
        }
    }
}

// レスポンス用の配列
$response = [];

try {
    switch ($action) {
        case 'save':
            // 回答の保存（改善版）
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!isset($input['questionId']) || !isset($input['answer'])) {
                    throw new Exception('必須パラメータが不足しています');
                }
                
                $question_id = $input['questionId'];
                $answer_text = $input['answer'];
                
                // 既存の回答データを読み込み
                $answers_data = json_decode(file_get_contents($answers_file), true);
                
                // セッションIDの確認と更新
                if (empty($answers_data['session_id']) || $answers_data['session_id'] !== $_SESSION['session_id']) {
                    $answers_data['session_id'] = $_SESSION['session_id'];
                    $answers_data['created_at'] = date('Y-m-d H:i:s');
                }
                
                // 変更があった場合のみバックアップ作成
                $old_answer = $answers_data['answers'][$question_id]['answer'] ?? '';
                if ($old_answer !== $answer_text) {
                    create_backup($answers_file);
                }
                
                // 回答データの更新
                $answers_data['answers'][$question_id] = [
                    'answer' => $answer_text,
                    'updated_at' => date('Y-m-d H:i:s'),
                    'character_count' => mb_strlen($answer_text)
                ];
                
                $answers_data['updated_at'] = date('Y-m-d H:i:s');
                
                // セーフな書き込み
                if (!safe_file_write($answers_file, json_encode($answers_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
                    throw new Exception('ファイルの保存に失敗しました');
                }
                
                // 定期的にCSVエクスポート（10回答ごと）
                if (count($answers_data['answers']) % 10 === 0) {
                    export_to_csv($answers_data);
                }
                
                $response = [
                    'success' => true,
                    'message' => '保存しました',
                    'saved_at' => date('Y-m-d H:i:s'),
                    'backup_created' => ($old_answer !== $answer_text)
                ];
            }
            break;

        case 'restore':
            // バックアップからの復元
            if ($method === 'GET' && isset($_GET['backup_file'])) {
                $backup_file = $backup_dir . basename($_GET['backup_file']);
                if (file_exists($backup_file)) {
                    $backup_data = file_get_contents($backup_file);
                    if (safe_file_write($answers_file, $backup_data)) {
                        $response = ['success' => true, 'message' => 'バックアップから復元しました'];
                    } else {
                        throw new Exception('復元に失敗しました');
                    }
                } else {
                    throw new Exception('バックアップファイルが見つかりません');
                }
            }
            break;

        case 'list_backups':
            // バックアップ一覧
            if ($method === 'GET') {
                $backups = [];
                $files = glob($backup_dir . '*.json');
                foreach ($files as $file) {
                    $backups[] = [
                        'filename' => basename($file),
                        'created' => date('Y-m-d H:i:s', filemtime($file)),
                        'size' => filesize($file)
                    ];
                }
                $response = ['backups' => $backups];
            }
            break;

        default:
            // 他のアクションは元のapi.phpと同じ
            include 'api.php';
            exit;
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

// CSV自動エクスポート関数
function export_to_csv($answers_data) {
    global $questions_file;
    $questions_data = json_decode(file_get_contents($questions_file), true);
    
    $csv_filename = 'data/auto_backup_' . date('Ymd_His') . '.csv';
    $output = fopen($csv_filename, 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM
    
    fputcsv($output, ['質問ID', 'カテゴリー', '質問', '回答', '文字数', '更新日時']);
    
    foreach ($questions_data['questions'] as $question) {
        $answer_data = $answers_data['answers'][$question['id']] ?? null;
        fputcsv($output, [
            $question['id'],
            $questions_data['categories'][$question['category']]['name'],
            $question['question'],
            $answer_data['answer'] ?? '',
            $answer_data['character_count'] ?? 0,
            $answer_data['updated_at'] ?? ''
        ]);
    }
    
    fclose($output);
}