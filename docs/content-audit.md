# ReactorFront 全ページ表現監査表

## 使い方

この監査表は、[ReactorFront 文面ガイド](content-writing-guide.md)に沿って、改稿前の問題、保護する事実、後続Issueを記録する正本である。

分類は「維持」「説明」「日本語化」「保護」を使う。複数の現行表現が同じ判断と改稿方向を持つ場合は、一つの行へまとめる。page別Issueの実装中に新しい表現や判断が見つかった場合は、先にこの表を更新する。

状態は次のいずれかとする。

- 未着手: 監査済みで、改稿はまだ行っていない
- 対応中: 担当Issueで改稿・確認している
- 完了: 文面、meta情報、構造化データ、画面を確認した
- 維持: 意図して現行表現を残した
- 延期: 理由と追跡Issueを記録した

## ページごとの主情報

| Page / component | 優先読者 | 日本語だけで伝える主情報 | 担当Issue | 状態 |
| --- | --- | --- | --- | --- |
| 共通header / footer / 404 | 全読者 | 現在地、移動先、連絡方法、存在しないpageから戻る方法 | #53 | 完了 |
| `/` | 顧客、エージェント | ReactorFrontの業務領域、実績、相談方法 | #53 | 完了 |
| `/profile/` | エージェント、採用担当、顧客 | 小野賢太郎の経歴、専門領域、第三者証拠、働き方 | #54 | 完了 |
| `/portfolio/` | 顧客、技術者 | Document Intelligence基盤の全体像、業務価値、確認できる証拠 | #55 | 完了 |
| `/portfolio/ml/` | 技術者、顧客 | MLモデルを評価、採用、追跡、rollbackする工程 | #56 | 未着手 |
| `/portfolio/aws/` | 技術者、顧客 | AWS環境を構築、検証、監視、撤収する一連の工程 | #57 | 未着手 |
| `/portfolio/aws/one-cent-ecr/` | 技術者、顧客 | 1セントの費用を追跡し、残存resourceを安全に検出・削除した判断 | #58 | 未着手 |
| `/infrastructure/` | フリーランス、顧客 | domain、DNS、Web、仕事用mailを安全に構成・維持する方法 | #59 | 未着手 |
| `/infrastructure/google-search/` | サイト運営者、顧客 | Googleが取得・解釈できる状態へ整えた作業と、Googleが決める結果の境界 | #60 | 未着手 |
| 全pageのmeta / Schema / alt / lastmod | 検索利用者、技術者 | 画面と機械向け情報が同じ事実を表すこと | #61 | 未着手 |

## 共通UI・ホーム・404

| Page / component | Section / 位置 | 想定読者 | 現行表現 | 分かりにくい理由 | 分類 | 改稿方向 | 維持する事実・証拠 | meta / Schema / altへの影響 | Issue / 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SiteHeader / SiteFooter | navigation、連絡link | 全読者 | `Portfolio`、`Infrastructure`、`Contact`、`Email`、`LinkedIn`、`GitHub` | 英語だけでは移動先が初見で分かりにくい | 日本語化 / 維持 | navigationは日本語を主にし、service名は維持 | route、外部profile URL、email | aria-label、link text | #53 / 完了 |
| SiteHeader | menu button | smartphone利用者 | `Open menu`、`Close menu` | 操作結果を日本語で伝えられる | 日本語化 | 「メニューを開く / 閉じる」 | button動作、aria-expanded | aria-label | #53 / 完了 |
| SiteHeader / SiteFooter / BrandMark | brand | 全読者 | `ReactorFront`、`リアクターフロント` | lowercaseを含む三表記の関係が仕様化されていない | 維持 / 説明 | 初出は `ReactorFront（リアクターフロント）`、Schemaの別名に `reactorfront` | logo、`@id`、domain | `name`、`alternateName`、alt、aria-label | #53 / 完了 |
| `/` | hero | 顧客 | `Independent Software Engineering / Tokyo`、`Now` | 何を提供し、現在何をしているかが直接分からない | 日本語化 | 提供業務と現在の専門領域を日本語で示す | 東京、独立事業者、現在のML研究開発 | title、description、OGP | #53 / 完了 |
| `/` | 業務領域 | 顧客 | `What I do`、`Product Engineering`、`Platform & Reliability`、`Applied ML` | 分類名だけでは実作業が分からない | 日本語化 / 説明 | 開発、運用基盤、ML活用で実際に行う作業を書く | Web、API、AWS、Linux、MLという技術範囲 | WebPage description | #53 / 完了 |
| `/` | portfolio導線 | 顧客、技術者 | `Featured Portfolio`、`Ingest / Analyze / Review / Audit` | 処理順と業務価値が英語依存 | 日本語化 | 「受付 / 解析 / 人による確認 / 監査記録」へ展開 | Document Intelligenceの処理順 | card label、alt | #53 / 完了 |
| `/` | infrastructure導線 | フリーランス、顧客 | `Domain / DNS / Web / Mail`、`Open knowledge` | 関係と公開目的が分からない | 日本語化 / 維持 | 独自domain、DNS、Web、mailの実構成と公開範囲を示す | 実構成、公開可能範囲 | card description | #53 / 完了 |
| `/` | footer CTA | 顧客 | `Independent Software Engineer`、`Start a conversation` | 相談できる内容と行動が分からない | 日本語化 | 相談対象と「メールで相談する」を示す | email | CTA、aria-label | #53 / 完了 |
| `/404/` | h1、案内 | 全読者 | `Page not found` | 日本語利用者へ状態が直接伝わらない | 日本語化 | 「ページが見つかりません」と戻り先を示す | 404 status、noindex | title、robots | #53 / 完了 |

## プロフィール

| Page / component | Section / 位置 | 想定読者 | 現行表現 | 分かりにくい理由 | 分類 | 改稿方向 | 維持する事実・証拠 | meta / Schema / altへの影響 | Issue / 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/profile/` | hero / section labels | エージェント、顧客 | `Profile`、`About`、`Career timeline` | 英語labelを読まないと節の役割を掴みにくい | 日本語化 | 「プロフィール」「これまでの経験」「経歴」 | 経歴の順序と期間 | title、description、ProfilePage | #54 / 完了 |
| `/profile/` | 第三者証拠 | エージェント、採用担当 | `Third-party signal`、`Selected evidence`、`Evidence, not adjectives` | 何を誰が確認した証拠かが曖昧 | 日本語化 | Findy等の第三者情報と一次資料を具体的に示す | Findyの表示値、取得日、画像 | caption、alt、ProfilePage description | #54 / 完了 |
| `/profile/` | 方針・技術範囲 | 顧客、技術者 | `Working principles`、`Technical range` | 抽象名詞だけで実務上の行動が分からない | 日本語化 | 判断方針と扱える範囲を作業単位で示す | 公開済みの専門領域 | WebPage text | #54 / 完了 |
| `/profile/` | 技術分類 | 技術者 | `Enterprise systems / operations`、`Modern web / cloud`、`Documents / OCR`、`Machine learning R&D` | 日本語の経歴との関係が分かりにくい | 説明 / 日本語化 | 業務システム、運用保守、Web・cloud、文書処理、ML研究開発へ展開 | 年数、技術名、担当範囲 | description | #54 / 完了 |
| `/profile/` | 人物と所属 | 全読者 | `Kentaro Ono`、`ReactorFront`、GitHub、LinkedIn | 人物名と事業者名の別名関係を分けて示す必要がある | 維持 / 説明 | 人物三表記とブランド三表記を別nodeで接続 | `Person @id`、`worksFor`、`sameAs` | ProfilePage、Person、ProfessionalService | #54 / 完了 |

## ポートフォリオ全体像

| Page / component | Section / 位置 | 想定読者 | 現行表現 | 分かりにくい理由 | 分類 | 改稿方向 | 維持する事実・証拠 | meta / Schema / altへの影響 | Issue / 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/portfolio/` | hero / summary | 顧客 | `{n}-minute overview`、`In one sentence`、`Why it matters` | 読了時間と価値が英語label依存 | 日本語化 | 「約n分で分かる全体像」「ひと言でいうと」「業務上の価値」 | 算出した読了時間、処理対象 | title、description、WebPage | #55 / 完了 |
| `/portfolio/` | processing flow | 顧客、技術者 | `How it works`、`Ingest / Analyze / Review / Audit` | 処理主体と順序が分からない | 日本語化 | PDF受付から監査記録までを日本語で順に示す | 認証、storage、queue、ML、人の確認 | 図のaria-label、description | #55 / 完了 |
| `/portfolio/` | architecture | 技術者 | `Four vertical slices`、`Vertical Slice`、`Under the hood`、`Web Application / Queue / ML Worker` | 抽象語と部品名だけで責務境界が分からない | 説明 / 日本語化 | 4つの業務単位と、各componentの役割を示す | 実repository構成、処理境界 | card label、alt | #55 / 完了 |
| `/portfolio/` | limitations / links | 顧客、技術者 | `Beyond classification`、`Honest limitations`、`Continue ... note`、`Public repository` | 制約と次の導線が英語依存 | 日本語化 / 維持 | 分類以外の範囲、現時点の制約、技術記事・公開repositoryへの導線を示す | repository URL、未実装範囲 | CTA、link text | #55 / 完了 |

## ML記事

| Page / component | Section / 位置 | 想定読者 | 現行表現 | 分かりにくい理由 | 分類 | 改稿方向 | 維持する事実・証拠 | meta / Schema / altへの影響 | Issue / 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/portfolio/ml/` | data / evaluation | 技術者 | `Dataset snapshot / split`、`Reproducible candidate`、`Per-sample evaluation` | 保存対象、分割方法、再現条件が見出しだけでは分からない | 日本語化 | datasetの保存、分割、候補再現、sample単位評価を説明 | fixture、評価手順、commit | Article description、図 | #56 / 未着手 |
| `/portfolio/ml/` | model adoption | 顧客、技術者 | `Champion / Candidate`、`Reviewed promotion manifest`、`promotion`、`rollback` | 採用主体、記録、戻し方が不明 | 説明 / 日本語化 | 現行モデルと更新候補、人の承認記録、戻す条件を示す | manifest、評価値、承認工程 | headline、caption | #56 / 未着手 |
| `/portfolio/ml/` | tracking / scope | 技術者 | `Runtime lineage`、`Document Intelligence scope`、`Current / Extension / Shared control plane`、`One governed loop` | 追跡対象と現在・将来範囲が抽象的 | 日本語化 | 入力からモデル・出力を追う記録、現在実装と拡張案を分ける | 現在の実装境界 | Article body、図 | #56 / 未着手 |
| `/portfolio/ml/` | metrics / evidence | 技術者 | `Evaluation metrics`、`Precision / Recall / F1 / Macro F1`、`Observed / bounded fixture`、`held-out synthetic samples` | 指標名だけでは測定条件と限界が分からない | 維持 / 説明 | 指標は維持し、合否条件、sample、観測範囲を日本語で説明 | 数値、sample数、syntheticである制約 | caption、Article description | #56 / 未着手 |
| `/portfolio/ml/` | article facts | 技術者 | `Audience / Source checked / Portfolio main / Format` | 誰向けで何を確認した記事かが英語依存 | 日本語化 / 保護 | 「想定読者 / 確認資料 / 対象commit / 記事の位置づけ」 | URL、commit、形式 | Article metadata | #56 / 未着手 |

## AWS記事

| Page / component | Section / 位置 | 想定読者 | 現行表現 | 分かりにくい理由 | 分類 | 改稿方向 | 維持する事実・証拠 | meta / Schema / altへの影響 | Issue / 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/portfolio/aws/` | lifecycle | 顧客、技術者 | `Authenticate / Assume / Apply / Test / Observe / Destroy`、`One lifecycle` | 誰が何を順に実行するかが英語だけ | 日本語化 / 説明 | 認証、権限引受、構築、動作確認、監視、撤収を順に説明 | 実行順、IAM境界 | Article description、図 | #57 / 未着手 |
| `/portfolio/aws/` | article facts / proof | 技術者 | `Audience / AWS checked / Portfolio main / Format`、`What this story proves`、`Accepted live proof / Read the evidence` | 確認対象と証拠の意味が曖昧 | 日本語化 / 保護 | 読者、確認環境、commit、確認結果、証拠linkを示す | AWS環境、commit、evidence URL | Article metadata | #57 / 未着手 |
| `/portfolio/aws/` | IAM / services | 技術者 | `IAM & roles`、`Read-only / Cost reader / Deploy operator`、`Ingress / Identity / Runtime / Messaging / State / Observability` | 権限差とservice責務が分かりにくい | 説明 / 日本語化 | 読み取り、費用確認、deploy権限と各AWS serviceの役割を示す | IAM policy、service構成 | 図中label、caption | #57 / 未着手 |
| `/portfolio/aws/` | architecture decisions | 顧客、技術者 | `Why Fargate`、`Cost is architecture`、`Two independent schedulers`、`Authenticated E2E` | 採用理由、費用、scheduler、合格条件が英語依存 | 日本語化 / 説明 | Fargate採用理由、費用との関係、2種類の起動、認証付き確認を説明 | 実AWS構成、測定条件 | headline、description | #57 / 未着手 |
| `/portfolio/aws/` | cleanup / boundary | 技術者 | `Destroy / Residual Sweep`、`Preflight / After E2E / Postflight`、`Failures are evidence / Honest boundary` | 削除確認と失敗時の扱いが抽象的 | 日本語化 | 撤収、残存0件検査、前後確認、失敗と制約を示す | resource件数、失敗記録 | Article body、caption | #57 / 未着手 |

## AWS 1セント追跡記事

| Page / component | Section / 位置 | 想定読者 | 現行表現 | 分かりにくい理由 | 分類 | 改稿方向 | 維持する事実・証拠 | meta / Schema / altへの影響 | Issue / 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/portfolio/aws/one-cent-ecr/` | hero / metrics | 顧客、技術者 | `AWS cost forensics / Field notes`、`Observed total / ECR per day / Residue / After cleanup` | 費用、残存、削除後の値が英語label依存 | 日本語化 | 何をいつ観測した金額・件数かを示す | 正確な金額、日時、画像 | Article description、caption | #58 / 未着手 |
| 同上 | cost progression | 技術者 | `Rounding / A lucky boundary`、`Daily increase / Visible step` | 丸めと日次増加の判断根拠が不明 | 日本語化 | 表示丸めと観測できた増加を区別する | Cost Explorer画像、観測値 | alt、caption | #58 / 未着手 |
| 同上 | attribution / inventory | 技術者 | `Attribution / Three different records`、`Generation / ECR inventory`、`Nine images / Three by three` | 記録の種類と9画像の内訳が分からない | 日本語化 / 維持 | 費用、repository、generation、image inventoryの関係を示す | repository数、generation数、image数 | 図、Article body | #58 / 未着手 |
| 同上 | detection / deletion | 技術者 | `Sweep gap / Exact, but too narrow`、`Mutation scope / Observation scope`、`Detect / Delete`、`Why detection only?` | 検出範囲と削除権限、停止判断が抽象的 | 日本語化 | 読み取り範囲、変更可能範囲、検出と削除を分ける | policy、対象ID、Issue・PR | Article body | #58 / 未着手 |
| 同上 | cleanup / evidence | 顧客、技術者 | `One-time cleanup / Exact targets`、`Epilogue / Small signal, real gap`、`Sources & verification` | 一括削除の条件と証跡が英語依存 | 日本語化 / 保護 | 承認後の対象限定削除、結果、一次資料を示す | 金額、target、commit、9画像 | CTA、caption | #58 / 未着手 |
| 同上 | repository label | 技術者 | `reactorfront/{repository.name}` | ブランド別名と実在識別子を混同しやすい | 保護 | 一切変更せず、repository名と説明する | ECR repository名 | code表示 | #58 / 維持 |

## インフラ入門

| Page / component | Section / 位置 | 想定読者 | 現行表現 | 分かりにくい理由 | 分類 | 改稿方向 | 維持する事実・証拠 | meta / Schema / altへの影響 | Issue / 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/infrastructure/` | hero / prologue | フリーランス | `Freelance infrastructure guide`、`Prologue / Why I built it`、`Mail / Web / Accounts` | 記事目的と整備順が英語依存 | 日本語化 | 開業後にmail、Web、accountを整えた理由と順序を示す | ReactorFrontの実構成 | Article description | #59 / 未着手 |
| 同上 | stack / principles | フリーランス、技術者 | `The actual stack`、`First principle`、`Why GitHub Pages` | 実構成、原則、採用理由が見出しだけでは不明 | 日本語化 / 維持 | 実際の構成と一般例を分け、GitHub Pages採用理由を示す | XServer、GitHub Pages、Google Workspace | Article body、図 | #59 / 未着手 |
| 同上 | delivery | 技術者 | `Source / Review / Build / Delivery`、`Delivery architecture`、`Observed` | 公開工程と確認結果が英語依存 | 日本語化 / 説明 | source更新、review、build、公開、実応答を順に示す | GitHub Actions、main、HTTP応答 | 図、caption | #59 / 未着手 |
| 同上 | setup | フリーランス | `DNS records / Build order`、`Domain & DNS / Website / Business email / Email authentication` | 構成要素と作業順が分かりにくい | 日本語化 / 維持 | domain、DNS、Web、仕事用mail、SPF等を順に説明 | record種別、domain | Article description、図 | #59 / 未着手 |
| 同上 | GitHub Pages settings | 技術者 | `Repository / Source / Custom domain / Enforce HTTPS` | 設定項目と判断が英語だけ | 説明 / 保護 | 公式設定名を保ち、値と目的を日本語で説明 | repository、branch、domain、HTTPS | code、図 | #59 / 未着手 |
| 同上 | operations | フリーランス | `Verification / Publish safely / Keep it healthy`、`Monthly / After merge / After change / Weekly / Quarterly`、`Small, understandable, yours` | 確認時期と合格状態が英語依存 | 日本語化 | 公開前後と定期確認の担当・時期・対象を示す | 運用周期、確認項目 | Article body | #59 / 未着手 |
| 同上 | name / domain | 全読者 | `ReactorFront`、`リアクターフロント`、`reactorfront.jp` | 屋号、別表記、domainの役割を分ける必要がある | 維持 / 説明 / 保護 | 三表記を同じ事業者へ結び、domainは識別子として説明 | `@id`、domain、email | ProfessionalService、WebSite | #59 / 未着手 |

## Google検索記事

| Page / component | Section / 位置 | 想定読者 | 現行表現 | 分かりにくい理由 | 分類 | 改稿方向 | 維持する事実・証拠 | meta / Schema / altへの影響 | Issue / 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/infrastructure/google-search/` | hero / prologue | サイト運営者 | `Google Search / Field notes`、`Prologue / After publishing` | 記事の位置づけと出発点が英語依存 | 日本語化 / 維持 | 公開後にGoogleの取得・解釈を整えた記録と示す | Google正式名称、公開日 | Article description | #60 / 未着手 |
| 同上 | search flow | サイト運営者 | `Crawl / Index / Serve`、`Baseline / Technical foundation` | 取得、索引、表示の違いと前提が分からない | 説明 / 日本語化 | 「取得 / 索引への登録 / 検索結果への表示」と技術的前提を示す | Googleが決定する処理 | 図、caption | #60 / 未着手 |
| 同上 | URL signals | 技術者 | `Canonical / Redirect / Sitemap` | 三者の役割と確認対象が不明 | 維持 / 説明 | 正規URL、転送、URL一覧として役割を説明 | canonical、redirect、sitemap URL | Article body | #60 / 未着手 |
| 同上 | entity | 技術者、顧客 | `Structured data / Entity graph` | 型と参照関係が初見で分からない | 説明 / 日本語化 | 人物、事業者、WebSite、記事、外部profileの関係として説明 | `@id`、`sameAs`、`publisher` | JSON-LD、図 | #60 / 未着手 |
| 同上 | brand aliases | 全読者 | `ReactorFront`、`リアクターフロント`、`reactorfront` | 同一事業者・サイトの別表記であることを明示する必要がある | 維持 / 説明 | `name`と優先順付き`alternateName`で同じnodeへ格納する | 安定した`@id`、`legalName` | ProfessionalService、WebSite | #60 / 未着手 |
| 同上 | visual identity | 顧客 | `Representative image / OGP / favicon`、`One mark across the site` | 画像ごとの用途と統一理由が英語依存 | 説明 / 日本語化 | 代表画像、共有画像、faviconの役割を示す | 既存画像path、寸法 | OGP、alt、link rel | #60 / 未着手 |
| 同上 | observations | 顧客、サイト運営者 | `What we actually saw`、`Japanese query / English query / Signed in / Private`、`AI-generated overview` | 観測条件とGoogle判断を区別しにくい | 日本語化 / 維持 | 検索語、login状態、観測日時、AI概要を事実として限定する | screenshot、検索語、日時 | caption、Article body | #60 / 未着手 |
| 同上 | evidence / boundary | 技術者 | `Change log / Public evidence`、`Boundaries`、`We can control / Google decides` | 実装責任と外部判断の境界が英語依存 | 日本語化 / 保護 | 変更履歴、公開証拠、自分たちが制御できる範囲を示す | PR、commit、Google公式資料 | CTA、link | #60 / 未着手 |
| 同上 | operations / sources | サイト運営者 | `After each meaningful release`、`Primary sources`、`From infrastructure to discovery` | 再確認時期、資料、次の導線が英語依存 | 日本語化 / 維持 | 意味のある更新後の確認、一次資料、前後記事への導線を示す | sitemap、Search Console、公式link | Article body | #60 / 未着手 |

## 全ページ共通の保護対象

| 対象 | 分類 | 規則 | 確認方法 | Issue / 状態 |
| --- | --- | --- | --- | --- |
| `API`、`Web`、`AWS`、`Linux`、`AI`、`DB`、`HTTP`、service・製品名 | 維持 | そのままの方が正確な場合は維持し、連結して意味が隠れる場合だけ日本語を添える | diffと画面 | #53〜#60 / 未着手 |
| code、command、環境変数、設定名、marker | 保護 | 文字列を変更しない | source diff、build | #53〜#60 / 未着手 |
| URL、canonical、route、domain、email、画像path | 保護 | 文字列と参照先を変更しない。変更が必要なら全参照を同時更新する | link、生成HTML、HTTP status | #61 / 未着手 |
| repository、branch、commit、Issue、PR、file名 | 保護 | 一次資料との照合に必要な表記を維持する | diff、link確認 | #53〜#60 / 未着手 |
| 氏名、所属、経歴、期間、金額、件数、日時、測定値 | 保護 | 確認済み事実だけを維持し、推測で補わない | 改稿前後diff、証拠 | #53〜#60 / 未着手 |
| title、description、OGP、JSON-LD、alt、caption | 同期 | 画面の主題と同じ事実・意味にする | 生成HTML、validator | #61 / 未着手 |
| 読了時間、`dateModified`、sitemap `lastmod` | 同期 | 本文量と実際の内容更新日から更新し、build日時を使わない | build、sitemap hash | #61 / 未着手 |

