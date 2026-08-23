# ReactorFront全ページ平易化・本番検証記録（2026-08-23）

## 結論

Epic #51で対象とした8つの公開ページ、404、共通header・footerは、平易な日本語への改稿、検索エンジン向け情報の同期、local・本番表示、Googleの公開取得テストまで完了した。

ReactorFront側で制御できる次の状態を確認した。

- 8つの公開ページは、PC幅とスマートフォン幅で主要情報を読める。
- 8つの公開URLはHTTPSで200を返し、Google Search Consoleの公開URLテストで取得・索引可能と判定された。
- プロフィールの`ProfilePage`、5記事の`Article`、対象ページの`BreadcrumbList`は、Google Rich Results Testで重大errorが0件である。
- `ReactorFront`、`リアクターフロント`、`reactorfront`は、同じ事業者とWebSiteの別表記として出力される。
- `小野賢太郎`、`小野 賢太郎`、`Kentaro Ono`、GitHub、LinkedInは、同じ`Person`へ結び付いている。
- `sitemap.xml`は8 URLを重複なく案内し、Search Consoleへの再送信後も「成功しました・検出されたページ数8」と表示された。

検索順位、実際のリッチリザルト、検索結果のサイト名、AIによる概要はGoogleが決める。実装完了とは分け、観測結果だけを本書へ記録する。

## 確認対象

- 確認日: 2026-08-23（日本標準時）
- 本番確認の基準commit: [`4d1e50a`](https://github.com/Kentaro-Ono-jp/reactorfront-site/commit/4d1e50a)
- 基準commitの本番公開: [GitHub Actions run 32624229164](https://github.com/Kentaro-Ono-jp/reactorfront-site/actions/runs/32624229164)
- local確認幅: PC 1425px、スマートフォン 375px
- 対象: 8公開route、存在しないURLの404、共通header・footer

## 自動確認とlocal表示

| 確認項目 | 結果 |
| --- | --- |
| `npm run build` | 成功。Astro診断はerror 0件、warning 0件、hint 0件 |
| 構造化data | 9 HTML、39 JSON-LD、`BreadcrumbList` 7件、`Article` 5件を検証 |
| metadata同期 | title、description、canonical、OGP、X card、WebPage系node、代表画像を9 HTMLで照合 |
| ブランド・人物 | 既存`@id`、publisher、worksFor、isPartOf、三つのブランド表記、三つの氏名表記、GitHub、LinkedInを照合 |
| sitemap | canonical URL 8件、重複0件。連続buildのSHA-256は2回とも`748B7B88FB4DC517047F666126FE4EBB06936E8CC60160810A02B59E2F1D5FBA` |
| 内部link | hrefとページ内fragment 131件、欠落0件 |
| 外部link | 62件を確認。55件はHEADで2xx、Google Help 6件はHEADの404に対してGETで200と移転先を確認、LinkedIn 1件は実browserで本人プロフィールを確認 |
| local画面 | 8公開routeと404を2幅、合計18表示で確認。文書全体の横はみ出し0、h1は各1件、見出しlevelの飛び0件、壊れた画像0件 |
| local実行error | 8公開route × 2幅の16表示はconsole error、page error、request失敗0件。404の2表示は意図した文書取得404だけを記録 |

外部linkの確認では、Google Helpの旧URLがHEAD要求へ404を返したが、通常のGET要求では200で新しいGoogle Workspace Knowledge Center等へ移動した。LinkedInは自動HTTP要求へ999を返すため、ログイン済みbrowserで`Kentaro Ono`の本人プロフィールとURLを確認した。これらを壊れたlinkとは判定していない。

全ページの冒頭を読み、対象読者と得られる情報が最初の見出しとleadから分かることも確認した。code欄や幅の広い表は専用領域内だけ横移動でき、文書全体は画面幅内に収まる。

## 本番HTTP・表示確認

| URL | HTTP | canonical・OGP URL | PC・スマートフォン |
| --- | ---: | --- | --- |
| `https://www.reactorfront.jp/` | 200 | 本番URLと一致 | 横はみ出しなし |
| `https://www.reactorfront.jp/profile/` | 200 | 本番URLと一致 | 横はみ出しなし |
| `https://www.reactorfront.jp/portfolio/` | 200 | 本番URLと一致 | 横はみ出しなし |
| `https://www.reactorfront.jp/portfolio/ml/` | 200 | 本番URLと一致 | 横はみ出しなし |
| `https://www.reactorfront.jp/portfolio/aws/` | 200 | 本番URLと一致 | 横はみ出しなし |
| `https://www.reactorfront.jp/portfolio/aws/one-cent-ecr/` | 200 | 本番URLと一致 | 横はみ出しなし |
| `https://www.reactorfront.jp/infrastructure/` | 200 | 本番URLと一致 | 横はみ出しなし |
| `https://www.reactorfront.jp/infrastructure/google-search/` | 200 | 本番URLと一致 | 横はみ出しなし |

追加確認は次のとおり。

- `https://reactorfront.jp/`は301で`https://www.reactorfront.jp/`へ移動する。
- 存在しない`/codex-verification-missing-page-62`は404を返し、独自404画面、`noindex, nofollow`、ホームへの導線を維持する。
- `robots.txt`と`sitemap.xml`は200を返し、robotsは本番sitemapを案内する。
- 画面が参照するCSS、代表画像、favicon、manifest等14 assetはすべて200を返す。
- 8公開route × 2幅の16表示は、console error、page error、request失敗0件だった。404の2表示だけは意図した404応答をbrowserがconsoleへ記録した。
- 本番`sitemap.xml`はlocal build生成物と一致する。

## 検索エンジン向け情報

本番ホームの生成HTMLとSchema.org Validatorで、次を確認した。

| node | 確認した値 |
| --- | --- |
| `ProfessionalService` | `name: ReactorFront`、`legalName: リアクターフロント`、`alternateName: [リアクターフロント, reactorfront]` |
| `WebSite` | `name: ReactorFront`、`alternateName: [リアクターフロント, reactorfront]` |
| `Person` | `name: 小野賢太郎`、`alternateName: [小野 賢太郎, Kentaro Ono]` |
| `Person.sameAs` | `https://github.com/Kentaro-Ono-jp`、`https://www.linkedin.com/in/kentaro-ono/` |
| 参照関係 | 既存の事業者・WebSite・Personの`@id`を維持し、publisher、founder、worksFor、isPartOfで参照。重複nodeなし |

Schema.org Validatorの2026-08-23 16:12確認では、ホームの`WebSite`と`ProfessionalService`に三つのブランド表記が表示され、エラーなし・警告なしだった。

## Google Rich Results Test

| 対象 | Googleの取得時刻 | 有効と判定されたtype | 重大error |
| --- | --- | --- | ---: |
| プロフィール | 16:10:57 | `BreadcrumbList`、地域のお店やサービス、`Organization`、`ProfilePage` | 0 |
| ML記事 | 16:11:38 | `Article`、`BreadcrumbList`、地域のお店やサービス、`Organization` | 0 |
| AWS記事 | 16:11:49 | `Article`、`BreadcrumbList`、地域のお店やサービス、`Organization` | 0 |
| AWS 1セント追跡記事 | 16:11:57 | `Article`、`BreadcrumbList`、地域のお店やサービス、`Organization` | 0 |
| インフラ入門 | 16:12:14 | `Article`、`BreadcrumbList`、地域のお店やサービス、`Organization` | 0 |
| Google検索記事 | 16:12:23 | `Article`、`BreadcrumbList`、地域のお店やサービス、`Organization` | 0 |

各ページとも「4件の有効なアイテムを検出しました」と判定された。地域のお店やサービスには、`telephone`、`priceRange`、`address`、`image`の4項目が「任意」として推奨される。公開していない電話番号、住所、価格帯等を検査合格のために作らず、重大ではない推奨事項として残した。

## Google Search Console

### 8 URLの公開取得テスト

| URL | 検査前のGoogle索引 | 公開URLテスト | テスト時刻 |
| --- | --- | --- | --- |
| `/` | 登録済み | Googleに登録可能・ページを索引へ登録可能 | 16:06 |
| `/profile/` | 登録済み | Googleに登録可能・ページを索引へ登録可能 | 16:08 |
| `/portfolio/` | 未登録 | Googleに登録可能・ページを索引へ登録可能 | 16:08 |
| `/portfolio/ml/` | 登録済み | Googleに登録可能・ページを索引へ登録可能 | 16:08 |
| `/portfolio/aws/` | 登録済み | Googleに登録可能・ページを索引へ登録可能 | 16:09 |
| `/portfolio/aws/one-cent-ecr/` | 登録済み | Googleに登録可能・ページを索引へ登録可能 | 16:09 |
| `/infrastructure/` | 登録済み | Googleに登録可能・ページを索引へ登録可能 | 16:10 |
| `/infrastructure/google-search/` | 登録済み | Googleに登録可能・ページを索引へ登録可能 | 16:10 |

8 URLすべてについて、現在の公開ページをGoogleが取得でき、索引へ登録可能であることを確認した。`/portfolio/`だけは検査前の索引へ未登録だったため、実装不備ではなくGoogle側の反映待ちとして区別する。

Search Consoleのサマリー画面は確認開始時点で「インデックス登録済み6ページ・未登録3ページ」と表示した。この集計には更新の遅延や対象外URLが含まれ得るため、本書では8 URLを個別に検査した結果を完了判定に使った。

### sitemap再送信と再クロール依頼

- 16:04に`https://www.reactorfront.jp/sitemap.xml`を再送信した。
- Search Consoleは「サイトマップを送信しました」と受理した。
- 一覧の状態は「成功しました」、送信日と最終読み込み日は2026-08-23、検出されたページ数8、動画数0だった。
- 16:07にホームのインデックス登録を再リクエストした。
- Search Consoleは「インデックス登録をリクエスト済み」「URLを優先クロール キューに追加しました」と表示した。

再送信と再クロール依頼は、即時反映や順位上昇を保証しない。Googleの処理完了を待つ作業であり、同じURLを繰り返し送っても優先順位は上がらない。

## 改稿前後の代表例

| 対象 | 改稿前 | 改稿後 |
| --- | --- | --- |
| 共通UI・ホーム・404 | `What I do`、`Start a conversation`、英語中心の404案内 | 「対応できること」「メールで相談」「ページが見つかりません」 |
| プロフィール | `Machine learning R&D`、`Human-in-the-loop`、`Working principles` | 「機械学習の研究開発」「AIの結果を人が確認・修正する工程」「設計・実装の判断基準」 |
| ポートフォリオ全体 | `Ingest / Analyze / Review / Audit`、`Four vertical slices` | 「PDFを受け付ける／AIで解析する／人が確認する／判断を記録する」「端から端まで通した4つの実装単位」 |
| ML記事 | `Champion / Candidate`、`Runtime lineage`、`Reviewed promotion manifest` | 「現行モデルと更新候補を比較」「推論時の来歴を保存」「承認済みの採用目録を保存」 |
| AWS記事 | `Authenticate / Assume / Apply / Test / Observe / Destroy`、`Destroy & sweep` | 「認証／権限切替／構築／動作確認／状態・log確認／撤収・残存検査」「撤収と、その後の残存検査」 |
| AWS 1セント追跡記事 | `Mutation scope / Observation scope`、`One-time cleanup / Exact targets` | 「削除してよい範囲／存在を確認する範囲」「対象を照合した一度限りの削除」 |
| インフラ入門 | `Source / Delivery`、Pages設定名だけの表示、英語の運用周期 | 「更新／公開」、日本語の役割に公式設定名を併記、「main反映後／DNS変更後／導入直後は毎週／3か月ごと」 |
| Google検索記事 | `Crawl / Index / Serve`、ブランド別名が単数 | 「取得／索引へ保存／検索結果へ表示」、`リアクターフロント`と`reactorfront`を同じnodeへ配列で関連付け |

書き換えでは、URL、route、commit、Issue・PR、氏名、経歴、金額、件数、測定値、一次資料linkを維持した。英語は削除を目的にせず、公式名称や照合に必要な語を日本語の後へ残した。

## 子Issue・PR・commit

| Issue | 担当 | PR | merge commit |
| ---: | --- | ---: | --- |
| #52 | 文面基準・全ページ監査 | [#63](https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/63) | [`6c4140d`](https://github.com/Kentaro-Ono-jp/reactorfront-site/commit/6c4140d) |
| #53 | 共通UI・ホーム・404 | [#64](https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/64) | [`e3b0aad`](https://github.com/Kentaro-Ono-jp/reactorfront-site/commit/e3b0aad) |
| #54 | プロフィール | [#65](https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/65) | [`8b93b6b`](https://github.com/Kentaro-Ono-jp/reactorfront-site/commit/8b93b6b) |
| #55 | ポートフォリオ全体 | [#66](https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/66) | [`d878766`](https://github.com/Kentaro-Ono-jp/reactorfront-site/commit/d878766) |
| #56 | ML記事 | [#67](https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/67) | [`79ebe5e`](https://github.com/Kentaro-Ono-jp/reactorfront-site/commit/79ebe5e) |
| #57 | AWS記事 | [#68](https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/68) | [`740aeea`](https://github.com/Kentaro-Ono-jp/reactorfront-site/commit/740aeea) |
| #58 | AWS 1セント追跡記事 | [#69](https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/69) | [`c9ae54f`](https://github.com/Kentaro-Ono-jp/reactorfront-site/commit/c9ae54f) |
| #59 | インフラ入門 | [#70](https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/70) | [`dfc56f5`](https://github.com/Kentaro-Ono-jp/reactorfront-site/commit/dfc56f5) |
| #60 | Google検索記事 | [#71](https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/71) | [`121321c`](https://github.com/Kentaro-Ono-jp/reactorfront-site/commit/121321c) |
| #61 | 全ページ横断同期 | [#72](https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/72) | [`4d1e50a`](https://github.com/Kentaro-Ono-jp/reactorfront-site/commit/4d1e50a) |
| #62 | 本番・Google最終検証 | FINAL_PR_LINK | merge後にEpic #51へ記録 |

## Googleが決める結果と観測記録

2026-08-23に提供されたGoogle検索画面では、検索語`reactorfront`でAIによる概要が表示され、ReactorFrontの事業説明と、LinkedIn・GitHubの引用元cardが確認された。通常の検索結果ではReactorFront公式サイトとサイト内linkも表示された。

これは同日の観測事実であり、次を保証するものではない。

- 同じ検索語、利用者、端末、login状態で同じ概要が再表示されること
- 引用元cardの内容や順序
- リッチリザルト、サイト名、favicon、サイトリンクの表示
- 検索順位やAIによる概要への継続採用

今後の確認はSearch Consoleの個別URL検査、サイトマップ状態、Rich Results Test、実際の検索画面を分けて行い、表示の変化だけから原因を断定しない。

## 完了判定

- [x] main相当のclean buildと既存testがPassした。
- [x] 8公開ページと404をPC幅・スマートフォン幅で確認した。
- [x] 表示崩れ、文書全体の横はみ出し、重大なconsole error、壊れた主要linkがない。
- [x] title、meta description、canonical、OGP、JSON-LDがページ内容と一致する。
- [x] 氏名表記、GitHub、LinkedIn、ブランド三表記の同一実体関係を維持した。
- [x] sitemapとrobotsをlocal・本番・Search Consoleで確認した。
- [x] 本番8ページはHTTPS 200、存在しないURLは404とnoindexを維持する。
- [x] Rich Results Testの重大errorは0件である。
- [x] Search Consoleの公開URLテストで8ページすべて取得・索引可能である。
- [x] sitemapを再送信し、成功・検出8ページを記録した。
- [x] ホームの再クロールを依頼し、実施日時を記録した。
- [x] 改稿前後、子Issue、PR、commitを集約した。
- [x] Googleが決める表示結果を実装完了条件から分離した。

停止条件に該当する問題は見つからなかった。Google側の索引反映待ちは`/portfolio/`の1 URLだけで、公開取得テストは合格しているためEpic完了を妨げない。
