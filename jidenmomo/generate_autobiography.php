<?php
/**
 * 自伝生成システム
 * CSVデータから構造化された自伝を生成
 */

// 最新のCSVファイルを読み込む
function loadLatestCSV() {
    $csv_files = glob('data/autobiography_*.csv');
    if (empty($csv_files)) {
        return false;
    }
    
    // 最新のファイルを取得
    usort($csv_files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    
    $csv_file = $csv_files[0];
    $csv_content = file_get_contents($csv_file);
    
    // BOMを削除
    if (substr($csv_content, 0, 3) === "\xEF\xBB\xBF") {
        $csv_content = substr($csv_content, 3);
    }
    
    // 改行コードを統一
    $csv_content = str_replace(["\r\n", "\r"], "\n", $csv_content);
    
    // CSVをパース
    $fp = fopen('php://temp', 'r+');
    fputs($fp, $csv_content);
    rewind($fp);
    
    $data = [];
    $header_skipped = false;
    
    while (($row = fgetcsv($fp)) !== FALSE) {
        if (!$header_skipped) {
            $header_skipped = true;
            continue;
        }
        
        if (count($row) >= 6 && $row[3] !== '') {
            $data[$row[0]] = [
                'category' => $row[1],
                'question' => $row[2],
                'answer' => $row[3],
                'length' => intval($row[4]),
                'updated' => $row[5]
            ];
        }
    }
    
    fclose($fp);
    return $data;
}

// 章立ての定義
$chapters = [
    [
        'title' => '第1章　雪国での幼少期 - 大家族と廃棄物処理業の原点',
        'categories' => ['幼少期'],
        'questions' => ['q001', 'q002', 'q003', 'q004', 'q026', 'q027']
    ],
    [
        'title' => '第2章　不登校からの覚醒 - パソコンとの出会い',
        'categories' => ['青年期'],
        'questions' => ['q005', 'q006', 'q028', 'q029', 'q030', 'q031', 'q032']
    ],
    [
        'title' => '第3章　社会復帰への道 - パソコンショップUSERでの10年',
        'categories' => ['社会人初期'],
        'questions' => ['q007', 'q033', 'q034']
    ],
    [
        'title' => '第4章　家業への参画 - 肉体労働への挑戦',
        'categories' => ['社会人初期'],
        'questions' => ['q009', 'q010', 'q011', 'q035', 'q036', 'q037']
    ],
    [
        'title' => '第5章　JCとの出会い - リーダーシップの覚醒',
        'categories' => ['社会人初期', '青年期'],
        'questions' => ['q008', 'q012', 'q042']
    ],
    [
        'title' => '第6章　経営者への転身 - 三代目としての決意',
        'categories' => ['起業期'],
        'questions' => ['q013', 'q014', 'q015', 'q016', 'q038', 'q039']
    ],
    [
        'title' => '第7章　危機と再生 - コロナ禍での挫折と復活',
        'categories' => ['起業期', '成長期'],
        'questions' => ['q040', 'q041']
    ],
    [
        'title' => '第8章　組織改革とIT化 - 年商4億円への道',
        'categories' => ['成長期'],
        'questions' => ['q017', 'q018', 'q019', 'q020', 'q043', 'q044', 'q045', 'q046']
    ],
    [
        'title' => '第9章　地域貢献と環境ビジネス - 循環型社会への挑戦',
        'categories' => ['現在・未来'],
        'questions' => ['q021', 'q022', 'q047', 'q048', 'q051']
    ],
    [
        'title' => '第10章　未来への展望 - 次世代への継承',
        'categories' => ['現在・未来'],
        'questions' => ['q023', 'q024', 'q025', 'q049', 'q050', 'q052', 'q053', 'q054', 'q055']
    ]
];

// 自伝を生成
function generateAutobiography($data, $chapters) {
    $output = "# 経営者自伝\n\n";
    $output .= "## 『雪国から世界へ - 引きこもりから廃棄物処理業三代目への軌跡』\n\n";
    $output .= "### 著者：大桃 隆太郎\n";
    $output .= "### 株式会社小出環境サービス 代表取締役\n\n";
    $output .= "---\n\n";
    
    // 目次
    $output .= "## 目次\n\n";
    foreach ($chapters as $index => $chapter) {
        $output .= ($index + 1) . ". " . $chapter['title'] . "\n";
    }
    $output .= "\n---\n\n";
    
    // 各章の内容
    foreach ($chapters as $chapter) {
        $output .= "## " . $chapter['title'] . "\n\n";
        
        foreach ($chapter['questions'] as $qid) {
            if (isset($data[$qid]) && !empty($data[$qid]['answer'])) {
                // 回答を段落に整形
                $answer = $data[$qid]['answer'];
                // 改行を適切に処理
                $paragraphs = preg_split('/\n\s*\n/', $answer);
                
                foreach ($paragraphs as $paragraph) {
                    $paragraph = trim($paragraph);
                    if (!empty($paragraph)) {
                        // 句読点で終わっていない場合は追加
                        if (!preg_match('/[。！？]$/', $paragraph)) {
                            $paragraph .= '。';
                        }
                        $output .= $paragraph . "\n\n";
                    }
                }
            }
        }
        
        $output .= "---\n\n";
    }
    
    return $output;
}

// 文字数カウント
function countCharacters($text) {
    // マークダウン記法を除去してカウント
    $plain = strip_tags($text);
    $plain = preg_replace('/[#\-\*_`]/u', '', $plain);
    return mb_strlen($plain);
}

// メイン処理
$data = loadLatestCSV();
if ($data) {
    $autobiography = generateAutobiography($data, $chapters);
    
    // ファイルに保存
    $filename = 'data/autobiography_draft_' . date('Ymd_His') . '.md';
    file_put_contents($filename, $autobiography);
    
    // 統計情報
    $char_count = countCharacters($autobiography);
    $page_estimate = ceil($char_count / 400); // 1ページ400文字として計算
    
    echo "=== 自伝生成完了 ===\n";
    echo "ファイル: $filename\n";
    echo "総文字数: " . number_format($char_count) . "文字\n";
    echo "推定ページ数: 約" . $page_estimate . "ページ（400字/ページ換算）\n";
    echo "\n";
    echo "現在の内容では約" . $page_estimate . "ページの本になります。\n";
    echo "100-200ページにするには、" . (100 * 400 - $char_count) . "～" . (200 * 400 - $char_count) . "文字追加が必要です。\n";
} else {
    echo "CSVファイルが見つかりません。\n";
}
?>