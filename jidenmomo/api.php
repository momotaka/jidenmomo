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

// レスポンス用の配列
$response = [];

try {
    switch ($action) {
        case 'questions':
            // 質問データの取得
            if ($method === 'GET') {
                $questions_data = json_decode(file_get_contents($questions_file), true);
                $response = $questions_data;
            }
            break;

        case 'save':
            // 回答の保存
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!isset($input['questionId']) || !isset($input['answer'])) {
                    throw new Exception('必須パラメータが不足しています');
                }
                
                $question_id = $input['questionId'];
                $answer_text = $input['answer'];
                
                // 既存の回答データを読み込み
                $answers_data = json_decode(file_get_contents($answers_file), true);
                
                // セッションIDの更新
                if ($answers_data['session_id'] !== $_SESSION['session_id']) {
                    $answers_data['session_id'] = $_SESSION['session_id'];
                    $answers_data['created_at'] = date('Y-m-d H:i:s');
                }
                
                // 回答データの更新
                $answers_data['answers'][$question_id] = [
                    'answer' => $answer_text,
                    'updated_at' => date('Y-m-d H:i:s'),
                    'character_count' => mb_strlen($answer_text)
                ];
                
                $answers_data['updated_at'] = date('Y-m-d H:i:s');
                
                // ファイルに保存
                if (file_put_contents($answers_file, json_encode($answers_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
                    throw new Exception('ファイルの保存に失敗しました');
                }
                
                $response = [
                    'success' => true,
                    'message' => '保存しました',
                    'saved_at' => date('Y-m-d H:i:s')
                ];
            }
            break;

        case 'progress':
            // 進捗データの取得
            if ($method === 'GET') {
                $questions_data = json_decode(file_get_contents($questions_file), true);
                $answers_data = json_decode(file_get_contents($answers_file), true);
                
                $total_questions = count($questions_data['questions']);
                $answered_questions = 0;
                $total_characters = 0;
                
                foreach ($answers_data['answers'] ?? [] as $answer) {
                    if (!empty($answer['answer'])) {
                        $answered_questions++;
                        $total_characters += $answer['character_count'] ?? 0;
                    }
                }
                
                $response = [
                    'total_questions' => $total_questions,
                    'answered_questions' => $answered_questions,
                    'progress_percentage' => round($answered_questions / $total_questions * 100),
                    'total_characters' => $total_characters,
                    'session_id' => $_SESSION['session_id'],
                    'created_at' => $answers_data['created_at'] ?? null,
                    'updated_at' => $answers_data['updated_at'] ?? null
                ];
            }
            break;

        case 'upload':
            // ファイルアップロード処理
            if ($method === 'POST') {
                if (!isset($_FILES['file'])) {
                    throw new Exception('ファイルがアップロードされていません');
                }
                
                $file = $_FILES['file'];
                $upload_dir = 'data/uploads/';
                
                // アップロードディレクトリの確認
                if (!is_dir($upload_dir)) {
                    mkdir($upload_dir, 0755, true);
                }
                
                // ファイル名の生成（セッションIDとタイムスタンプを使用）
                $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $filename = $_SESSION['session_id'] . '_' . time() . '.' . $extension;
                $filepath = $upload_dir . $filename;
                
                // ファイルの移動
                if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                    throw new Exception('ファイルの保存に失敗しました');
                }
                
                $response = [
                    'success' => true,
                    'filename' => $filename,
                    'filepath' => $filepath,
                    'size' => $file['size'],
                    'type' => $file['type']
                ];
            }
            break;

        case 'export':
            // データのエクスポート
            if ($method === 'GET') {
                $format = $_GET['format'] ?? 'json';
                $answers_data = json_decode(file_get_contents($answers_file), true);
                $questions_data = json_decode(file_get_contents($questions_file), true);
                
                if ($format === 'csv') {
                    // CSVエクスポート
                    header('Content-Type: text/csv; charset=utf-8');
                    header('Content-Disposition: attachment; filename="autobiography_' . date('Ymd_His') . '.csv"');
                    
                    $output = fopen('php://output', 'w');
                    // BOM for Excel
                    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
                    
                    // ヘッダー行
                    fputcsv($output, ['質問ID', 'カテゴリー', '質問', '回答', '文字数', '更新日時']);
                    
                    // データ行
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
                    exit;
                } else {
                    // JSONエクスポート
                    $response = [
                        'questions' => $questions_data,
                        'answers' => $answers_data
                    ];
                }
            }
            break;

        default:
            throw new Exception('無効なアクションです');
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}