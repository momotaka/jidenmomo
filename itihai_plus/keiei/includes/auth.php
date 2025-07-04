<?php
require_once 'config.php';
require_once 'db.php';

class Auth {
    private static $db;
    
    public static function init() {
        self::$db = Database::getInstance();
        
        // セッションが開始されていない場合のみ設定を変更
        if (session_status() === PHP_SESSION_NONE) {
            // セッション設定
            ini_set('session.name', SESSION_NAME);
            ini_set('session.cookie_lifetime', SESSION_LIFETIME);
            ini_set('session.cookie_httponly', 1);
            ini_set('session.use_only_cookies', 1);
            ini_set('session.use_strict_mode', 1);
            
            session_start();
        }
    }
    
    public static function login($username, $password) {
        self::init();
        
        // ユーザー情報取得
        $sql = "SELECT * FROM keiei_users WHERE username = :username";
        $user = self::$db->fetchOne($sql, ['username' => $username]);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            // セッションにユーザー情報保存
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['login_time'] = time();
            
            // セッションID再生成（セキュリティ対策）
            session_regenerate_id(true);
            
            return true;
        }
        
        return false;
    }
    
    public static function logout() {
        self::init();
        
        // セッション変数クリア
        $_SESSION = [];
        
        // セッションクッキー削除
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time() - 3600, '/');
        }
        
        // セッション破棄
        session_destroy();
    }
    
    public static function isLoggedIn() {
        self::init();
        
        if (isset($_SESSION['user_id']) && isset($_SESSION['login_time'])) {
            // セッションタイムアウトチェック
            if (time() - $_SESSION['login_time'] > SESSION_LIFETIME) {
                self::logout();
                return false;
            }
            
            // ログイン時間更新
            $_SESSION['login_time'] = time();
            return true;
        }
        
        return false;
    }
    
    public static function requireLogin() {
        if (!self::isLoggedIn()) {
            header('Location: /keiei/index.php');
            exit;
        }
    }
    
    public static function getUserId() {
        return $_SESSION['user_id'] ?? null;
    }
    
    public static function getUsername() {
        return $_SESSION['username'] ?? null;
    }
    
    public static function createUser($username, $password) {
        self::init();
        
        // パスワードハッシュ化
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        
        try {
            $data = [
                'username' => $username,
                'password_hash' => $passwordHash
            ];
            
            return self::$db->insert('keiei_users', $data);
        } catch (PDOException $e) {
            // ユーザー名重複エラー
            if ($e->getCode() == 23000) {
                return false;
            }
            throw $e;
        }
    }
    
    public static function updatePassword($userId, $newPassword) {
        self::init();
        
        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        
        $data = ['password_hash' => $passwordHash];
        $where = "id = :id";
        $whereParams = ['id' => $userId];
        
        return self::$db->update('keiei_users', $data, $where, $whereParams);
    }
    
    public static function verifyPassword($userId, $password) {
        self::init();
        
        $sql = "SELECT password_hash FROM keiei_users WHERE id = :id";
        $user = self::$db->fetchOne($sql, ['id' => $userId]);
        
        if ($user) {
            return password_verify($password, $user['password_hash']);
        }
        
        return false;
    }
}