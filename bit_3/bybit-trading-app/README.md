# Bybit Trading App

Bybitのテストネットでリアルタイム価格取得と売買機能を持つWebアプリケーション。

## 機能

- リアルタイム価格表示（WebSocket使用）
- 売買注文の発行（成行・指値）
- ポジション一覧表示
- 残高表示
- 価格チャート表示
- 複数通貨ペア対応（BTC/USDT、ETH/USDT、SOL/USDT）

## セットアップ

1. 依存関係のインストール:
```bash
npm install
```

2. 環境変数の設定:
`.env.local`ファイルを作成し、Bybitテストネットの認証情報を設定：
```
BYBIT_API_KEY=your_testnet_api_key_here
BYBIT_API_SECRET=your_testnet_api_secret_here
BYBIT_TESTNET=true
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

3. 開発サーバーの起動:
```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## Bybitテストネットの設定

1. [Bybitテストネット](https://testnet.bybit.com/)にアクセス
2. アカウントを作成
3. API管理ページでAPIキーとシークレットを生成
4. 生成したキーを`.env.local`に設定

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- CCXT (暗号通貨取引所ライブラリ)
- Socket.io (WebSocket)
- Recharts (チャート表示)

## プロジェクト構造

```
src/
├── app/             # Next.js App Router
│   ├── api/         # APIエンドポイント
│   └── page.tsx     # メインページ
├── components/      # Reactコンポーネント
├── lib/             # ユーティリティ
├── types/           # TypeScript型定義
└── hooks/           # カスタムフック
```