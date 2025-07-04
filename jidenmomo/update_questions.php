<?php
// 既存の質問データを読み込む
$questions_data = json_decode(file_get_contents('data/questions.json'), true);

// 深掘り質問を追加
$additional_questions = [
    // 幼少期の深掘り
    [
        "id" => "q026",
        "category" => "childhood",
        "question" => "お父様が社長になる前と後で、家族の生活や雰囲気はどのように変わりましたか？当時のお父様の忙しさや、外車のエピソードも含めて、もう少し詳しく教えてください。",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q027",
        "category" => "childhood",
        "question" => "今の自分を見て「親子だな」と思うという部分について、具体的にどんな共通点がありますか？また、お父様の経営者としての姿勢から学んだことはありますか？",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q028",
        "category" => "childhood",
        "question" => "新潟県魚沼市（旧湯之谷村）の雪国での生活経験は、現在の経営哲学や仕事への取り組み方にどのような影響を与えていますか？",
        "required" => false,
        "type" => "text"
    ],
    
    // 青年期の深掘り
    [
        "id" => "q029",
        "category" => "youth",
        "question" => "不登校になってからパソコンショップUSERでアルバイトを始めるまでの期間、どのような心の変化がありましたか？関さんとの出会いはどのようなきっかけだったのでしょうか？",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q030",
        "category" => "youth",
        "question" => "パソコンゲームのチートやMODから始まったプログラミングへの興味が、後に農家の在庫管理システムや浄化槽管理ソフトの修繕につながったとのことですが、独学でどのように技術を身につけていったのか教えてください。",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q031",
        "category" => "youth",
        "question" => "不登校時代に同級生が家に遊びに来てくれたエピソードがありましたが、学校に行かなくても友人関係を維持できた理由は何だと思いますか？また、その経験は現在の人間関係構築にどう活きていますか？",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q032",
        "category" => "youth",
        "question" => "ヤフオクでコピーゲームを売ったり、コオロギを育てて売ったりしていた時期がありましたが、その経験から学んだビジネスの基本や、現在の経営に活きている考え方はありますか？",
        "required" => false,
        "type" => "text"
    ],
    
    // 社会人初期の深掘り
    [
        "id" => "q033",
        "category" => "early_career",
        "question" => "パソコンショップUSERでの10年間で、技術的なスキル以外に学んだ最も重要なことは何ですか？また、関さんから受けた影響について具体的に教えてください。",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q034",
        "category" => "early_career",
        "question" => "週3日のバイトから正社員になる決断をした時、「後ろ髪を引かれながら」とありましたが、その時の葛藤と、最終的に決断した理由を詳しく教えてください。",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q035",
        "category" => "early_career",
        "question" => "JCでの経験が「覚醒」だったとのことですが、具体的にどのような活動や出会いが、引きこもりだった自分を変えたのでしょうか？全裸キャラになったエピソードも含めて。",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q036",
        "category" => "early_career",
        "question" => "JCの理事長を経験されたとのことですが、その時に実践した組織運営の方法や、現在の経営に活かしている具体的な手法があれば教えてください。",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q037",
        "category" => "early_career",
        "question" => "東急コミュニティー様との出会いが「営業の大切さを知れたエピソード」とのことですが、その経験から確立した営業スタイルや、チラシ作成のこだわりについて教えてください。",
        "required" => false,
        "type" => "text"
    ],
    
    // 起業期の深掘り
    [
        "id" => "q038",
        "category" => "entrepreneurship",
        "question" => "2020年のコロナ禍で「朝起き上がれなくなった」経験から復職するまでの過程と、その経験が経営者としての考え方にどのような影響を与えたか教えてください。",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q039",
        "category" => "entrepreneurship",
        "question" => "施設維持課の独立統合による「暗黒期」を乗り越えた具体的な施策について、価格改善や環境整備、管理強化の内容を詳しく教えてください。",
        "required" => false,
        "type" => "text"
    ],
    
    // 成長期の深掘り
    [
        "id" => "q040",
        "category" => "growth",
        "question" => "社員一人に年間60万円の教育投資をされているとのことですが、具体的にどのような教育プログラムを実施し、その効果をどう測定していますか？",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q041",
        "category" => "growth",
        "question" => "「ITと環境整備（5Sアクション）がセット」という考え方について、具体的にどのようにITを活用して5S活動を推進しているのか、事例を交えて教えてください。",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q042",
        "category" => "growth",
        "question" => "JCで学んだ「資本関係がない人間にどう動いてもらうか」という経験が、現在の社員マネジメントにどのように活かされているか、具体例を教えてください。",
        "required" => false,
        "type" => "text"
    ],
    
    // 現在・未来の深掘り
    [
        "id" => "q043",
        "category" => "present_future",
        "question" => "リユースショップの開設を計画されているとのことですが、廃棄物処理業からリユース事業への展開について、具体的なビジネスモデルと地域への貢献イメージを教えてください。",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q044",
        "category" => "present_future",
        "question" => "「社長が一カ月会社にいなくても成り立つ組織」を作れたとのことですが、どのような仕組みや文化づくりでそれを実現したのか、具体的な取り組みを教えてください。",
        "required" => false,
        "type" => "text"
    ],
    [
        "id" => "q045",
        "category" => "present_future",
        "question" => "「地域として活気のある夢のある街を作りたい」という想いについて、廃棄物処理業を通じてどのような地域貢献を目指しているのか、具体的なビジョンを教えてください。",
        "required" => false,
        "type" => "text"
    ]
];

// 既存の質問に追加
foreach ($additional_questions as $question) {
    $questions_data['questions'][] = $question;
}

// ファイルに保存
file_put_contents('data/questions.json', json_encode($questions_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo "質問を追加しました。合計" . count($questions_data['questions']) . "問になりました。\n";
?>