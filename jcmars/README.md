# JCMARS - JC Member Auto-Ranking System

日本青年会議所（JC）の役職者情報を自動収集・分析し、信頼度ランキング形式で表示するシステムです。

## 概要

「役職は覚えているが名前が思い出せない」問題を解決するため、リアルタイムでWeb検索を行い、JC役職者の情報を収集・ランキング表示します。

## 主な機能

- 年度・地域・役職を指定してJC役職者を検索
- Google検索結果から自動的に情報を抽出
- 信頼度スコアに基づいてランキング表示
- 複数の情報源から候補者を特定
- キャッシュ機能による高速化

## 技術スタック

- **Backend**: Python 3.11 + FastAPI
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Scraping**: aiohttp + BeautifulSoup4
- **Container**: Docker + Docker Compose

## クイックスタート

### 前提条件

- Docker と Docker Compose がインストールされていること
- ポート 80, 3000, 8000 が空いていること

### セットアップ

1. リポジトリをクローン
```bash
git clone <repository-url>
cd jcmars
```

2. 環境変数ファイルを作成
```bash
cp .env.example .env
```

3. Docker Composeで起動
```bash
docker-compose up -d
```

4. ブラウザでアクセス
```
http://localhost
```

### 開発環境での起動

#### バックエンド
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

#### フロントエンド
```bash
cd frontend
npm install
npm start
```

## 使い方

1. 検索フォームに以下を入力：
   - **年度**: 検索したい年度（例: 2020）
   - **地域名**: 地域やブロック名（例: 新潟ブロック、関東地区協議会）
   - **役職**: 役職名（例: 会長、理事長、委員長）
   - **追加キーワード**（任意）: 絞り込み用キーワード

2. 「思い出す！」ボタンをクリック

3. 10〜60秒程度で検索結果が表示されます

## API仕様

### エンドポイント

- `POST /api/v1/search`: JC役職者検索
- `GET /api/v1/regions`: 地域一覧取得
- `GET /api/v1/positions`: 役職一覧取得
- `GET /api/v1/health`: ヘルスチェック

### 検索リクエスト例

```json
{
  "year": 2020,
  "region_name": "新潟ブロック",
  "position": "会長",
  "min_confidence": 0.6,
  "max_results": 20
}
```

## システム構成

```
jcmars/
├── backend/           # FastAPIバックエンド
│   ├── main.py       # メインアプリケーション
│   ├── models.py     # データモデル定義
│   ├── scraper.py    # スクレイピングエンジン
│   ├── ranking.py    # ランキング計算
│   ├── cache.py      # キャッシュ管理
│   └── utils.py      # ユーティリティ関数
├── frontend/          # Reactフロントエンド
│   ├── src/
│   │   ├── components/  # UIコンポーネント
│   │   ├── types.ts     # TypeScript型定義
│   │   ├── api.ts       # API通信
│   │   └── App.tsx      # メインコンポーネント
│   └── public/
├── docker/           # Docker設定
└── docker-compose.yml

```

## 注意事項

- このシステムは公開されているWeb情報のみを検索対象としています
- 検索には10〜60秒程度かかる場合があります
- 過度な検索はサーバーに負荷をかけるため、適度な利用を心がけてください
- 検索結果の正確性は情報源に依存します

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。