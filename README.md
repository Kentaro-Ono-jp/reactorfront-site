# ReactorFront website

リアクターフロント（ReactorFront）の公式サイトです。

- 公開URL: <https://www.reactorfront.jp/>
- 構成: Astro / TypeScript / 静的生成
- 公開先: GitHub Pages

## ローカル開発

Node.js 22.12 以上を使用します。

```powershell
npm install
npm run dev
```

`http://localhost:4321/` を開くと確認できます。

## 検証

```powershell
npm run check
npm run build
npm run preview
```

GitHub の `Settings → Pages → Build and deployment → Source` を
`GitHub Actions` に設定しておくと、`main` ブランチへの push を契機に
静的サイトをビルドし、GitHub Pages へ公開します。

画像の由来と生成条件は [ASSET_NOTES.md](ASSET_NOTES.md) に記録しています。

## 文面と表現監査

- [ReactorFront 文面ガイド](docs/content-writing-guide.md)
- [全ページ表現監査表](docs/content-audit.md)
