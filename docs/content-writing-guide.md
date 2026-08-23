# ReactorFront 文面ガイド

## 結論

ReactorFront公式サイトの外向け文面は、日本語だけで「何を扱い、何を行い、どう確認し、どのような価値を提供できるか」を追える表現にする。

日本の開発現場で馴染みの薄い英語の複合語は、その語を知っていることを前提にしない。正式名称、code、URL、commit、数値等は保護し、周囲の日本語で役割を説明する。

この文書を、サイト本文、見出し、button、画像説明、meta情報、構造化データを新規作成または更新するときの正本とする。

## 想定読者

優先順位は次のとおりとする。

1. ReactorFrontへ相談・依頼する可能性がある顧客
2. 案件を紹介するエージェント、採用担当、協業相手
3. 実装や検証内容を詳しく確認するエンジニア

読者が特定repositoryの内部用語や、英語の複合語を知っていることを前提にしない。一方、技術者が一次資料と照合できる正式名称、識別子、数値、linkは残す。

## 適用対象

- `src/pages/`配下の公開ページと404
- `SiteHeader`、`SiteFooter`、`Breadcrumbs`、`ArticleCover`等の共通表示
- h1〜h3、補助見出し、card label、図中label、本文、注記、CTA
- title、meta description、OGP
- `WebSite`、`ProfessionalService`、`ProfilePage`、`Article`、`WebPage`等の構造化データ
- alt、caption、読了時間、公開日、更新日、sitemap `lastmod`

原文のcode、command、設定値、URL、数値は勝手に変えない。難しい公式名称や識別子はそのまま残し、周囲に意味を添える。

## 英語表現の4分類

監査時は、英語を必ず次のいずれかへ分類する。

| 分類 | 判断 | 例 | 扱い |
| --- | --- | --- | --- |
| 維持 | そのままの方が短く正確な一般用語・正式名称 | `API`、`Web`、`AWS`、`GitHub`、`Linux`、`AI`、`DB`、`HTTP`、製品名 | 必要な範囲で維持する |
| 説明 | 原語の検索性や照合可能性は必要だが、初見では意味が伝わりにくい | `E2E`、`CI/CD`、`IaC`、`rollback`、`repository`、`container` | 初出を「分かりやすい日本語（原語）」にする |
| 日本語化 | 英語だけでは節の役割や実際の作業が分からない | `What this story proves`、`Runtime lineage`、`Residual Sweep` | 作業、条件、結果が分かる日本語へ展開する |
| 保護 | code、URL、設定値、識別子、一次資料の正式title | `reactorfront.jp`、`main`、commit SHA、Issue・PR番号、repository名 | 表記を変えず、必要なら周囲で説明する |

固定の禁止語listでは判定しない。同じ語でも、見出し、説明文、code、公式名称で分類が変わる。

## ブランド名と人物名

### 事業者・サイト

- 優先する正式表記: `ReactorFront`
- 日本語表記: `リアクターフロント`
- 検索や入力で使われる小文字表記: `reactorfront`

三表記は同じ事業者・サイトを指す。画面では初見の読者に必要な場所で `ReactorFront（リアクターフロント）` と自然に示す。`reactorfront` を検索目的で本文へ反復しない。

構造化データでは、既存の事業者とWebSiteの `@id` を維持し、次の関係を正本とする。

```json
{
  "name": "ReactorFront",
  "alternateName": ["リアクターフロント", "reactorfront"]
}
```

事業者の `legalName` に設定した `リアクターフロント` を維持する。domain、email、repository名、画像path等に含まれる `reactorfront` は識別子として保護する。

### 代表者

- 優先する氏名: `小野賢太郎`
- 空白入り表記: `小野 賢太郎`
- 英語表記: `Kentaro Ono`

三表記は同じ人物を指す。`Person.sameAs` のGitHubとLinkedInは人物の本人確認情報であり、事業者公式accountとして扱わない。`Person.worksFor` から既存の事業者 `@id` を参照する。

## 基本原則

### 1. 日本語を主情報、英語を副情報にする

見出し、本文、button、図の説明は、日本語だけで意味が通ることを必須とする。英語の補助labelを残しても、その英語だけに節の意味を持たせない。

### 2. 専門語を実際の作業へ展開する

文脈に応じ、次の要素が読める日本語へ直す。

- 誰が、またはどの処理が行うか
- 何を確認、変更、保存、比較、削除するか
- いつ、どの順序で行うか
- どの状態なら成功か
- 何が起きたら停止、再試行、rollbackするか
- 依頼者や利用者へどのような価値があるか

### 3. 短さより誤解の少なさを優先する

短くすることだけを目的に、別の専門語へ置き換えない。一方、内部の思考過程や不要な技術史を足して、本題を埋めない。

### 4. 技術的な証拠を弱めない

読みやすさを理由に、事実、制約、失敗、検証条件を削らない。結論を先に置き、詳細と証拠を後段に残す。

### 5. 事実、判断、制約・未確認を分ける

- 事実: code、CI、実環境、log、画面、請求、公開資料で確認したこと
- 判断: 事実に基づく採用理由、合否、設計判断
- 制約・未確認: 未実施、環境差、権限外、将来確認が必要な事項

検索結果、リッチリザルト、AIによる概要等、外部serviceが決める結果を保証しない。未確認事項には確認方法または追跡先を添える。

## 文脈に応じた言い換え

次は機械的な置換表ではない。対象と作業に合わせて日本語を選ぶ。

| 分かりにくい表現 | 作業内容が分かる表現 |
| --- | --- |
| `What this story proves` | この実証で確認したこと |
| `Human-in-the-loop` | AIの結果を人が確認・修正する工程 |
| `Champion / Candidate` | 現行モデル（Champion）と更新候補（Candidate） |
| `model lineage` / `Runtime lineage` | どのデータ、設定、モデルから出力されたかを追跡する記録 |
| `promotion manifest` | 採用するモデル、評価結果、承認者を残す記録 |
| `Authenticated E2E` | 認証を通した本番相当の一連動作確認 |
| `Preflight` / `Postflight` | 実行前確認 / 実行後確認 |
| `Residual Sweep` / `zero-residue sweep` | 残存resourceが0件であることを確認する最終検査 |
| `Mutation scope` | 削除・変更してよい範囲 |
| `Observation scope` | 読み取り確認する範囲 |
| `Cost is architecture` | 構成の選択が費用を決める |
| `runtime readiness` | 実行に必要なserviceやfileが揃っている状態 |
| `cleanup convergence` | 対象の削除が最後まで完了すること |
| `entity graph` | 人物、事業者、サイト、記事、外部profileの参照関係 |
| `Crawl / Index / Serve` | 取得 / 索引への登録 / 検索結果への表示 |

`manifest`、`artifact`、`scope`等は文脈で実体を示す。別の短い専門語へ置き換えただけで終わらせない。

## ページの基本構成

技術ページは、必要な範囲で次の順序を採用する。

1. 結論または、このページで分かること
2. 対象読者と前提
3. 問題または出発点
4. 実施した作業と選択理由
5. 成功条件と確認結果
6. 制約、失敗、未確認事項
7. 一次資料、repository、Issue・PR、公式資料
8. 依頼者または利用者に提供できる価値

## 画面文面と機械向け情報の同期

本文を変更したページでは、次の順序で照合する。

1. h1、lead、各節の見出しと本文を確定する。
2. title、meta description、OGPの意味を本文へ合わせる。
3. `WebPage`、`ProfilePage`、`Article`の `name`、`headline`、`description`、画像説明を合わせる。
4. 著者、公開日、更新日、代表画像、`publisher`、`isPartOf`を確認する。
5. 本文量に応じて既存方式で読了時間を再計算する。
6. 実際に内容を変更したrouteだけ `src/site-metadata.ts` の更新日を変更する。
7. `Article.dateModified` とsitemap `lastmod`が同じ正本を参照することを確認する。
8. 連続buildで内容が変わらない限り、sitemapのhashが変わらないことを確認する。

## 事実を保護する確認手順

改稿前後のdiffで、次を個別に確認する。

- 氏名、屋号、所属、経歴、期間、金額、件数、日時
- AWS service、技術構成、権限境界、測定値
- URL、canonical、route、email、domain
- repository、branch、commit、Issue、PR、file名
- 画像とcaption、一次資料link、公式資料link
- 制約、失敗、対象外、再現条件

文章以外の値が変わった場合は、文面変更の副作用か、新しい確認済み事実かを分ける。確認できない変更は戻す。

## Review checklist

- [ ] 冒頭で結論、このページで分かること、または読者に求める行動が分かる。
- [ ] 日本語だけで各節の役割を追える。
- [ ] 馴染みの薄い英語の複合語が、説明なしで主情報として残っていない。
- [ ] 一般的な用語、正式名称、識別子まで不自然に日本語化していない。
- [ ] 問題、作業、理由、成功条件、結果、制約、提供価値を必要な範囲で追える。
- [ ] 事実、判断、制約・未確認事項を区別している。
- [ ] 氏名、屋号、期間、金額、件数、URL、commit、証拠linkを変えていない。
- [ ] `ReactorFront`、`リアクターフロント`、`reactorfront`を同じ事業者・サイトの表記として扱っている。
- [ ] `小野賢太郎`、`小野 賢太郎`、`Kentaro Ono`を同じ人物の表記として扱っている。
- [ ] 画面文面、title、meta description、OGP、JSON-LD、alt、captionの意味が一致している。
- [ ] 読了時間、更新日、`dateModified`、sitemap `lastmod`を同期した。
- [ ] PC幅とスマートフォン幅で、見出し、図、code、linkが読める。
- [ ] build、構造化データ検査、sitemap検査が成功する。
- [ ] 公開できない内部情報、秘密情報、非公開linkを追加していない。
- [ ] 検索順位、リッチリザルト、AIによる概要への採用を保証していない。

