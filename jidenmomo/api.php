<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// »Ã·çóÁ§Ã¯
if (!isset($_SESSION['session_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// ê¯¨¹Èá½ÃÉh¢¯·çónÖ—
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Çü¿Õ¡¤ënÑ¹
$questions_file = 'data/questions.json';
$answers_file = 'data/answers.json';

// ì¹Ýó¹(nM
$response = [];

try {
    switch ($action) {
        case 'questions':
            // êOÇü¿nÖ—
            if ($method === 'GET') {
                $questions_data = json_decode(file_get_contents($questions_file), true);
                $response = $questions_data;
            }
            break;

        case 'save':
            // ÞTnÝX
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!isset($input['questionId']) || !isset($input['answer'])) {
                    throw new Exception('ÅÑéáü¿L³WfD~Y');
                }
                
                $question_id = $input['questionId'];
                $answer_text = $input['answer'];
                
                // âXnÞTÇü¿’­¼
                $answers_data = json_decode(file_get_contents($answers_file), true);
                
                // »Ã·çóIDnô°
                if ($answers_data['session_id'] !== $_SESSION['session_id']) {
                    $answers_data['session_id'] = $_SESSION['session_id'];
                    $answers_data['created_at'] = date('Y-m-d H:i:s');
                }
                
                // ÞTÇü¿nô°
                $answers_data['answers'][$question_id] = [
                    'answer' => $answer_text,
                    'updated_at' => date('Y-m-d H:i:s'),
                    'character_count' => mb_strlen($answer_text)
                ];
                
                $answers_data['updated_at'] = date('Y-m-d H:i:s');
                
                // Õ¡¤ëkÝX
                if (file_put_contents($answers_file, json_encode($answers_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
                    throw new Exception('Õ¡¤ënÝXk1WW~W_');
                }
                
                $response = [
                    'success' => true,
                    'message' => 'ÝXW~W_',
                    'saved_at' => date('Y-m-d H:i:s')
                ];
            }
            break;

        case 'progress':
            // 2WÇü¿nÖ—
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
            // Õ¡¤ë¢Ã×íüÉæ
            if ($method === 'POST') {
                if (!isset($_FILES['file'])) {
                    throw new Exception('Õ¡¤ëL¢Ã×íüÉUŒfD~[“');
                }
                
                $file = $_FILES['file'];
                $upload_dir = 'data/uploads/';
                
                // ¢Ã×íüÉÇ£ì¯Èênº
                if (!is_dir($upload_dir)) {
                    mkdir($upload_dir, 0755, true);
                }
                
                // Õ¡¤ën»Ã·çóIDh¿¤à¹¿ó×’(	
                $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $filename = $_SESSION['session_id'] . '_' . time() . '.' . $extension;
                $filepath = $upload_dir . $filename;
                
                // Õ¡¤ënûÕ
                if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                    throw new Exception('Õ¡¤ënÝXk1WW~W_');
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
            // Çü¿n¨¯¹ÝüÈ
            if ($method === 'GET') {
                $format = $_GET['format'] ?? 'json';
                $answers_data = json_decode(file_get_contents($answers_file), true);
                $questions_data = json_decode(file_get_contents($questions_file), true);
                
                if ($format === 'csv') {
                    // CSV¨¯¹ÝüÈ
                    header('Content-Type: text/csv; charset=utf-8');
                    header('Content-Disposition: attachment; filename="autobiography_' . date('Ymd_His') . '.csv"');
                    
                    $output = fopen('php://output', 'w');
                    // BOM for Excel
                    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
                    
                    // ØÃÀüL
                    fputcsv($output, ['êOID', '«Æ´êü', 'êO', 'ÞT', '‡Wp', 'ô°åB']);
                    
                    // Çü¿L
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
                    // JSON¨¯¹ÝüÈ
                    $response = [
                        'questions' => $questions_data,
                        'answers' => $answers_data
                    ];
                }
            }
            break;

        default:
            throw new Exception('!¹j¢¯·çógY');
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}