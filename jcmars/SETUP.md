# JCMARS セットアップガイド

このドキュメントでは、JC Member Auto-Ranking System (JCMARS) のセットアップ手順を詳しく説明します。

## 目次

1. [前提条件](#前提条件)
2. [環境別セットアップ](#環境別セットアップ)
3. [トラブルシューティング](#トラブルシューティング)
4. [本番環境へのデプロイ](#本番環境へのデプロイ)

## 前提条件

### システム要件

- **OS**: Windows 10/11, macOS 10.15以降, Ubuntu 20.04以降
- **メモリ**: 4GB以上（推奨8GB）
- **ストレージ**: 2GB以上の空き容量
- **CPU**: 2コア以上

### 必須ソフトウェア

#### Docker環境（推奨）
- Docker Desktop 4.0以降
- Docker Compose 2.0以降

#### ローカル開発環境
- Python 3.11以降
- Node.js 18以降
- npm 8以降 または yarn 1.22以降
- Git

### ポート使用状況

以下のポートが空いている必要があります：
- **80**: Nginx（プロダクション）
- **3004**: React開発サーバー（変更可能）
- **8000**: FastAPI

> **注意**: ポート3000-3003と5001が使用中の場合は、3004を使用します。他のポートに変更したい場合は、docker-compose.ymlと.envファイルを編集してください。

## 環境別セットアップ

### 1. Docker環境でのセットアップ（推奨）

#### 1.1 リポジトリのクローン

```bash
# GitHubからクローン
git clone https://github.com/your-username/jcmars.git
cd jcmars

# または、ZIPファイルから展開
unzip jcmars.zip
cd jcmars
```

#### 1.2 環境変数の設定

```bash
# 環境変数ファイルをコピー
cp .env.example .env

# 必要に応じて編集
# Windows: notepad .env
# Mac/Linux: nano .env または vim .env
```

環境変数の説明：
```env
# バックエンド設定
ENVIRONMENT=development              # 環境（development/production）
ALLOWED_ORIGINS=http://localhost:3004,http://localhost  # CORS許可オリジン（ポート3004使用）

# フロントエンド設定
REACT_APP_API_URL=http://localhost:8000  # APIエンドポイント
```

> **ポート変更が必要な場合**: 
> - docker-compose.ymlの`ports`セクションで`3004:3000`を`任意のポート:3000`に変更
> - .envファイルの`ALLOWED_ORIGINS`も同じポートに変更

#### 1.3 Dockerイメージのビルドと起動

```bash
# 初回起動（イメージのビルドを含む）
docker-compose up --build -d

# ビルドログを確認したい場合
docker-compose up --build

# 起動状態の確認
docker-compose ps

# ログの確認
docker-compose logs -f
```

#### 1.4 アクセス確認

1. ブラウザで http://localhost にアクセス
2. JCMARSのトップページが表示されることを確認

### 2. ローカル開発環境でのセットアップ

#### 2.1 バックエンドのセットアップ

```bash
# バックエンドディレクトリに移動
cd backend

# Python仮想環境の作成（推奨）
python -m venv venv

# 仮想環境の有効化
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 依存関係のインストール
pip install -r requirements.txt

# 開発サーバーの起動
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 2.2 フロントエンドのセットアップ

新しいターミナルを開いて：

```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係のインストール
npm install
# または
yarn install

# 開発サーバーの起動
npm start
# または
yarn start
```

#### 2.3 動作確認

1. バックエンドAPI: http://localhost:8000/docs
2. フロントエンド: http://localhost:3004

> **注意**: ローカル開発環境でReactを起動する場合、デフォルトではポート3000を使用しますが、すでに使用中の場合は自動的に次の空きポート（3004など）が選択されます。

### 3. 開発環境のカスタマイズ

#### 3.1 VSCode推奨拡張機能

`.vscode/extensions.json`を作成：

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker"
  ]
}
```

#### 3.2 開発用スクリプト

`scripts/dev.sh`を作成（Mac/Linux）：

```bash
#!/bin/bash
# 開発環境起動スクリプト

echo "Starting JCMARS development environment..."

# バックエンドを起動
cd backend
source venv/bin/activate
uvicorn main:app --reload &
BACKEND_PID=$!

# フロントエンドを起動
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Ctrl+Cで両方のプロセスを終了
trap "kill $BACKEND_PID $FRONTEND_PID" INT
wait
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. Dockerが起動しない

```bash
# Dockerサービスの状態確認
docker version

# Dockerデーモンが起動していない場合
# Windows/Mac: Docker Desktopを起動
# Linux:
sudo systemctl start docker
```

#### 2. ポートが既に使用されている

```bash
# 使用中のポートを確認
# Windows:
netstat -ano | findstr :8000
# Mac/Linux:
lsof -i :8000

# プロセスを終了
# Windows:
taskkill /PID <PID> /F
# Mac/Linux:
kill -9 <PID>
```

#### 3. 依存関係のインストールエラー

```bash
# Pythonの場合
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir

# Node.jsの場合
rm -rf node_modules package-lock.json
npm install
```

#### 4. CORSエラー

`.env`ファイルの`ALLOWED_ORIGINS`を確認：

```env
ALLOWED_ORIGINS=http://localhost:3004,http://localhost:8000,http://127.0.0.1:3004
```

ポートを変更した場合は、必ず`ALLOWED_ORIGINS`も同じポートに更新してください。

### ログの確認方法

```bash
# Docker環境
docker-compose logs backend    # バックエンドログ
docker-compose logs frontend   # フロントエンドログ
docker-compose logs -f         # 全サービスのログをリアルタイム表示

# ローカル環境
# バックエンド: ターミナルに直接表示
# フロントエンド: ブラウザの開発者ツール（F12）
```

## 本番環境へのデプロイ

### 1. VPSの準備

#### 1.1 サーバー要件
- OS: Ubuntu 22.04 LTS
- メモリ: 2GB以上
- ストレージ: 20GB以上
- 固定IPアドレス

#### 1.2 初期設定

```bash
# システムの更新
sudo apt update && sudo apt upgrade -y

# 必要なパッケージのインストール
sudo apt install -y docker.io docker-compose git nginx certbot python3-certbot-nginx

# Dockerグループにユーザーを追加
sudo usermod -aG docker $USER
```

### 2. SSL証明書の設定（Let's Encrypt）

```bash
# Nginxの設定
sudo nano /etc/nginx/sites-available/jcmars

# 以下の内容を追加
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 設定を有効化
sudo ln -s /etc/nginx/sites-available/jcmars /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL証明書の取得
sudo certbot --nginx -d your-domain.com
```

### 3. 本番用環境変数

`.env.production`を作成：

```env
# 本番環境設定
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-domain.com
REACT_APP_API_URL=https://your-domain.com/api

# セキュリティ設定（必要に応じて）
SECRET_KEY=your-secret-key-here
API_KEY=your-api-key-here
```

### 4. デプロイスクリプト

`scripts/deploy.sh`を作成：

```bash
#!/bin/bash
# 本番環境デプロイスクリプト

echo "Deploying JCMARS..."

# 最新のコードを取得
git pull origin main

# 環境変数を本番用に切り替え
cp .env.production .env

# Dockerイメージの再ビルドと起動
docker-compose down
docker-compose up --build -d

# ヘルスチェック
sleep 10
curl -f http://localhost/api/v1/health || exit 1

echo "Deployment completed successfully!"
```

### 5. 監視とメンテナンス

#### 5.1 ヘルスチェックの設定

```bash
# cronでヘルスチェック
crontab -e

# 5分ごとにヘルスチェック
*/5 * * * * curl -f http://localhost/api/v1/health || docker-compose restart
```

#### 5.2 ログローテーション

```bash
# /etc/logrotate.d/jcmars
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

#### 5.3 バックアップ

```bash
# 日次バックアップスクリプト
#!/bin/bash
BACKUP_DIR="/backup/jcmars"
DATE=$(date +%Y%m%d)

# アプリケーションファイルのバックアップ
tar -czf $BACKUP_DIR/jcmars-$DATE.tar.gz /path/to/jcmars

# 古いバックアップの削除（30日以上）
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

## セキュリティ設定

### ファイアウォール設定

```bash
# UFWの設定
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Rate Limiting

Nginx設定に追加：

```nginx
# /etc/nginx/sites-available/jcmars
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://localhost:8000;
}
```

## アップデート手順

```bash
# 1. バックアップの作成
./scripts/backup.sh

# 2. 最新版の取得
git pull origin main

# 3. 依存関係の更新
docker-compose build --no-cache

# 4. サービスの再起動
docker-compose down
docker-compose up -d

# 5. 動作確認
curl http://localhost/api/v1/health
```

## サポート

問題が解決しない場合は、以下の情報を添えてイシューを作成してください：

1. エラーメッセージの全文
2. 実行したコマンド
3. 環境情報（OS、Dockerバージョンなど）
4. ログファイル（`docker-compose logs`の出力）