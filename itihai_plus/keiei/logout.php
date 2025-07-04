<?php
require_once 'includes/auth.php';
require_once 'includes/functions.php';

// ログアウト処理
Auth::logout();

// ログイン画面へリダイレクト
redirect('/keiei/index.php');