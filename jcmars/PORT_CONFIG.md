# ポート設定ガイド

JCMARSのポート設定をカスタマイズする方法を説明します。

## デフォルトポート設定

- **80**: Nginx（本番環境）
- **3004**: React開発サーバー（3000-3003が使用中のため）
- **8000**: FastAPI

## ポート変更方法

### 1. フロントエンドのポートを変更する場合

例：3004から3005に変更

#### Step 1: docker-compose.ymlを編集

```yaml
frontend:
  build: ./frontend
  container_name: jcmars-frontend
  ports:
    - "3005:3000"  # 3004:3000 から変更
```

#### Step 2: .envファイルを編集

```env
ALLOWED_ORIGINS=http://localhost:3005,http://localhost
```

#### Step 3: Dockerを再起動

```bash
docker-compose down
docker-compose up -d
```

### 2. バックエンドのポートを変更する場合

例：8000から8080に変更

#### Step 1: docker-compose.ymlを編集

```yaml
backend:
  build: ./backend
  container_name: jcmars-backend
  ports:
    - "8080:8000"  # 8000:8000 から変更
```

#### Step 2: .envファイルを編集

```env
REACT_APP_API_URL=http://localhost:8080
```

#### Step 3: docker-compose.ymlのfrontend環境変数も更新

```yaml
frontend:
  environment:
    - REACT_APP_API_URL=http://backend:8000  # コンテナ間通信は変更不要
```

### 3. ローカル開発環境でのポート変更

#### Reactの場合

```bash
# 環境変数で指定
PORT=3005 npm start

# または package.json を編集
"scripts": {
  "start": "PORT=3005 react-scripts start"
}
```

#### FastAPIの場合

```bash
# コマンドラインで指定
uvicorn main:app --port 8080

# または環境変数
export PORT=8080
uvicorn main:app --port $PORT
```

## 使用中のポートを確認する方法

### Windows

```bash
# 特定のポートを確認
netstat -ano | findstr :3004

# すべてのポートを確認
netstat -ano
```

### macOS/Linux

```bash
# 特定のポートを確認
lsof -i :3004

# すべてのポートを確認
netstat -tlnp
```

## ポート競合の解決

### 自動ポート選択（Reactのみ）

Reactは起動時にポートが使用中の場合、自動的に次の空きポートを提案します：

```
? Something is already running on port 3004. Would you like to run the app on another port instead? (Y/n)
```

### 手動でポートを解放

```bash
# プロセスIDを確認
lsof -i :3004

# プロセスを終了
kill -9 <PID>
```

## 推奨ポート範囲

- 開発環境: 3000-9999
- 本番環境: 80（HTTP）、443（HTTPS）

## トラブルシューティング

### エラー: bind: address already in use

```bash
# Docker コンテナを確認
docker ps

# 該当コンテナを停止
docker stop <container_name>

# すべてのコンテナを停止
docker-compose down
```

### CORSエラーが発生する場合

ポートを変更した後は、必ず以下を更新してください：

1. `.env`の`ALLOWED_ORIGINS`
2. フロントエンドの`REACT_APP_API_URL`（APIポート変更時）
3. ブラウザのキャッシュをクリア

## セキュリティ上の注意

- 本番環境では標準ポート（80, 443）を使用
- 開発環境でのみカスタムポートを使用
- ファイアウォールでポートを適切に制御