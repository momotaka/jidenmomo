# X Auto Poster - AI自動投稿ボット

## 概要
このアプリケーションは、AIを使用してX（Twitter）に自動的に投稿を行うボットです。OpenAIのGPTモデルを使用してコンテンツを生成し、定期的にXに投稿します。

## アーキテクチャ

### 主要コンポーネント

1. **TwitterClient** (`src/twitter.js`)
   - X API v2を使用した投稿機能
   - 認証管理
   - スレッド投稿対応

2. **ContentGenerator** (`src/contentGenerator.js`)
   - OpenAI APIを使用したコンテンツ生成
   - トピックベースの投稿生成
   - スレッド生成機能
   - 文字数制限対応（280文字）

3. **Scheduler** (`src/scheduler.js`)
   - node-cronを使用した定期実行
   - 設定可能な投稿間隔
   - 投稿履歴管理

4. **Database** (`src/database.js`)
   - SQLite3によるローカルDB
   - 投稿履歴の保存
   - 重複投稿防止

5. **Config** (`src/config.js`)
   - 環境変数管理
   - API認証情報
   - ボット設定

## 機能

- **自動投稿**: 設定した間隔で自動的にツイートを生成・投稿
- **AIコンテンツ生成**: GPTモデルによる自然な文章生成
- **トピック選択**: 様々なトピックからランダムに選択
- **スレッド対応**: 複数ツイートの連続投稿
- **履歴管理**: 投稿履歴をDBに保存
- **ログ記録**: Winstonによる詳細なログ
- **CLI管理**: コマンドラインからの操作

## 必要な認証情報

1. **X (Twitter) API**
   - API Key
   - API Secret
   - Access Token
   - Access Token Secret

2. **OpenAI API**
   - API Key

## データフロー

```
[Scheduler] → [ContentGenerator] → [Generated Content]
                                          ↓
[Database] ← [Post History] ← [TwitterClient] → [X Platform]
```

## セキュリティ考慮事項

- 環境変数による認証情報管理
- .envファイルはgitignoreに追加
- ログにセンシティブ情報を含まない設計