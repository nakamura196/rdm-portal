# GakuNin RDM Search API (`/api/v1/search/`) 調査メモ

> **調査日**: 2026-02-24
> **対象**: GakuNin RDM (GRDM) の Search API
> **ソースコード**: [RCOSDP/RDM-osf.io](https://github.com/RCOSDP/RDM-osf.io)（`website/search/` ディレクトリ）
> **開発者ガイド**: [RCOSDP/RDM-developer-guide](https://github.com/RCOSDP/RDM-developer-guide)
> **注意**: Search API の公式ドキュメントは確認できませんでした。本稿は API の実際の挙動とソースコードの両方に基づく調査記録です。

---

## 概要

GakuNin RDM は OSF (Open Science Framework) のフォークであり、ソースコードは [GitHub (RCOSDP/RDM-osf.io)](https://github.com/RCOSDP/RDM-osf.io) で公開されています。検索機能の実装は `website/search/` ディレクトリにあり、主に以下のファイルで構成されています。

| ファイル | 役割 |
|---|---|
| `elastic_search.py` | インデックスのマッピング定義、ドキュメントの登録・更新 |
| `views.py` | API エンドポイントのハンドラ |
| `util.py` | `build_private_search_query()` 等のクエリ構築 |
| `search.py` | 上位インターフェース |

```
POST https://rdm.nii.ac.jp/api/v1/search/
Authorization: Bearer <パーソナルアクセストークン>
```

日本語環境では Elasticsearch の `kuromoji_analyzer` が使用されています（ソースコードで確認）。

---

## リクエスト形式

```json
{
  "api_version": {"vendor": "grdm", "version": 2},
  "elasticsearch_dsl": {
    "query": {
      "filtered": {
        "query": {
          "query_string": {
            "default_field": "_all",
            "query": "検索キーワード"
          }
        }
      }
    },
    "from": 0,
    "size": 10
  },
  "highlight": "title:30,name:30,user:30,text:124,comments.*:124",
  "sort": "modified_desc"
}
```

| パラメータ | 説明 | 備考 |
|---|---|---|
| `api_version` | `vendor: "grdm"`, `version: 2` | `version` は 1 と 2 をサポートしています（ソースコードで確認） |
| `elasticsearch_dsl.query` | Elasticsearch Query DSL | `filtered` 形式（ES 2.x 系構文）です |
| `from` / `size` | ページネーション | `size=100` まで動作を確認しています。`match_all` + `size>50` では 500 エラーになります |
| `highlight` | `フィールド名:文字数` 形式 | GRDM 独自フォーマットです。ワイルドカード（`comments.*`）も使えます |
| `sort` | ソート順 | 後述します |

### sort の選択肢

ソースコード（`util.py` の `build_private_search_query`）によると、以下のソート対象が定義されています。

| sort 値 | 動作確認 | 説明 |
|---|---|---|
| `modified_desc` / `modified_asc` | 確認済み | 更新日順 |
| `created_desc` / `created_asc` | 確認済み | 作成日順 |
| `project_desc` / `project_asc` | 未確認 | プロジェクト名順（ソースに定義あり） |
| `file_desc` / `file_asc` | 未確認 | ファイル名順（ソースに定義あり） |
| `wiki_desc` / `wiki_asc` | 未確認 | Wiki名順（ソースに定義あり） |
| `user_desc` / `user_asc` | 未確認 | ユーザー名順（ソースに定義あり） |
| `institution_desc` / `institution_asc` | 未確認 | 機関名順（ソースに定義あり） |

> `relevance`, `title_asc` 等はソースに定義がなく、実際に 400 エラーとなることを確認しました。

---

## インデックスに登録されるフィールド（ソースコードより）

ソースコード `elastic_search.py` の `update_file()`, `update_node()`, `update_user()` から、各カテゴリでインデックスに登録されるフィールドを確認できます。

### file（`update_file()`）

| フィールド | ソース | `_all` 検索 | 備考 |
|---|---|---|---|
| `name` | `file_.name` | **ヒットします** | ハイライト確認済み |
| `normalized_name` | `unicode_normalize(file_.name)` | — | kuromoji 用 |
| `node_title` | `target.title` | **ヒットします** | 所属プロジェクト名 |
| `creator_name` | ユーザー情報から取得 | **ヒットします** | |
| `modifier_name` | ユーザー情報から取得 | 未確認 | |
| `tags` | ファイルのタグ | **ヒットします** | ハイライト確認済み |
| `normalized_tags` | 正規化タグ | ヒットします | ハイライト確認済み |
| `extra_search_terms` | `clean_splitters(file_.name)` | 未確認 | ファイル名をトークン分割したもの |
| `comments` | `comments_to_doc()` | 未確認 | テストデータになし |
| `node_public` | `target.is_public` | — | フィルタ用 |
| `node_contributors` | コントリビュータID一覧 | — | 権限フィルタ用 |
| `deep_url` | ファイルURL | — | 表示用 |
| `date_created` / `date_modified` | 日時 | — | ソート用 |
| `category` | `"file"` 固定 | — | |

> **`folder_name` と `parent_title` / `parent_url` はインデックスに含まれません。** これらはレスポンス時に `format_results()` で動的に付与されます（ソースコードで確認）。

### project（`update_node()`）

| フィールド | ソース | `_all` 検索 | 備考 |
|---|---|---|---|
| `title` | `node.title` | ヒットします | |
| `normalized_title` | 正規化タイトル | — | kuromoji 用 |
| `description` | `node.description` | **ヒットします** | ハイライト確認済み |
| `normalized_description` | 正規化説明文 | — | kuromoji 用 |
| `tags` | プロジェクトタグ | **ヒットします** | |
| `normalized_tags` | 正規化タグ | — | |
| `contributors` | コントリビュータ情報 | — | |
| `creator_name` | 作成者名 | ヒットします | |
| `comments` | コメント | 未確認 | |
| `wikis` | Wiki コンテンツ | 未確認 | 動的テンプレートでマッピングされます |
| `license` | ライセンス情報 | — | 表示用 |
| `affiliated_institutions` | 所属機関 | — | |
| `boost` | ブースト値 | — | |

### user（`update_user()`）

| フィールド | ソース | 備考 |
|---|---|---|
| `user` | `user.fullname` | |
| `normalized_user` / `normalized_names` | 正規化名 | |
| `job` / `job_title` | 職業情報 | |
| `ongoing_job` / `ongoing_job_department` / `ongoing_job_title` | 現在の勤務先 | |
| `school` / `ongoing_school*` | 学歴 | |
| `emails` | メールアドレス | |
| `social` | SNS リンク | |
| `boost` | `2` 固定 | ユーザーの検索スコアを上げるために設定されています |

### その他のカテゴリ（ソースコードに定義あり）

ソースコードによると、`file`, `project`, `user` 以外に以下のカテゴリも存在します。

- `component` — プロジェクトのサブコンポーネント
- `registration` — 登録（スナップショット）
- `preprint` — プレプリント
- `wiki` — Wiki ページ（`text` フィールドに本文が入ります）
- `comment` — コメント
- `institution` — 機関
- `collectionsubmission` — コレクション投稿

> `text` ハイライトフィールドは **Wiki ページのコンテンツ** を対象としたものである可能性が高いです（ファイル本文ではありません）。

---

## `_all` フィールドの検索対象

### Elasticsearch マッピング（ソースコードより）

`_all` フィールドは `kuromoji_analyzer` で解析されます。ソースコードの `create_index()` では、各フィールドに対してアナライザが設定されており、アナライザが設定されたフィールドは `_all` に含まれます。

### 実験で確認した検索対象

| 検索語 | マッチしたフィールド | カテゴリ | ハイライトで確認 |
|---|---|---|---|
| `"2507"` | `name`（ファイル名） | file | `highlight[name]` |
| `"dmp-project-aaa"` | `node_title`（プロジェクト名） | file | — |
| `"Nakamura"` | `creator_name`（作成者名） | file | — |
| `"blockchain"` | `tags`（タグ） | file | `highlight[tags]` |
| `"arxiv"` | `tags` / `normalized_tags` | file | `highlight[tags]`, `highlight[normalized_tags]` |
| `"アーカイブズ学"` | `description`（プロジェクト説明） | project | `highlight[description]` |
| `"digital-preservation"` | `tags`（プロジェクトタグ） | project | — |

### 検索対象外であることを確認

| 検索語 | 対象フィールド | カテゴリ | 理由 |
|---|---|---|---|
| `"NII Storage"` | `folder_name` | file | インデックスに含まれません（`format_results()` で動的付与） |
| `"digital preservation framework"` | `file_description` | file | DataCite メタデータは検索対象外です |
| `"Clio-X"` | `.txt` ファイル本文 | file | ファイル本文はインデックスされません |
| `"Victoria Lemieux"` | `.txt` ファイル本文 | file | 同上 |

---

## フィルタ

| フィルタ形式 | 結果 |
|---|---|
| `{"term": {"category": "file"}}` | 動作します |
| `{"and": [{"term": ...}, {"term": ...}]}` | 動作します |
| `{"bool": {"should": [...]}}` | 動作します |
| `{"bool": {"must": [...]}}` | 500 エラーになります |

> `bool` + `must` が失敗する原因は不明です。ソースコード上は `build_private_search_query()` 内で `bool` + `must` が使用されているため、API ラッパー側の制約と推測されます。回避策として `and` フィルタまたは `query_string` の AND 構文を使用できます。

---

## ハイライト

### 確認済み

| フィールド | カテゴリ | 確認した検索語 |
|---|---|---|
| `name` | file | `"ip2"` |
| `tags` | file | `"blockchain"`, `"arxiv"` |
| `normalized_tags` | file | `"arxiv"` |
| `description` | project | `"アーカイブズ学"` |

### 未確認

- `text` — ソースコードによると Wiki ページの本文がこのフィールドに入ります。Wiki のあるプロジェクトでテスト可能と思われます。
- `comments.*` — コメントの動的フィールドです。テストデータにコメントがなかったため未確認です。
- `title` — プロジェクトタイトルです。検索語がタイトルに一致するケースでテスト可能です。
- `user` — ユーザー名です。

---

## DataCite メタデータ

### 編集可能フィールド

`/v2/files/{id}/metadata_records/` で管理されます。ただし OSF が編集を許可するフィールドは以下の4つに限定されています（バリデーションスキーマで確認）。

| フィールド | 型 | 説明 |
|---|---|---|
| `resource_type` | enum | `Audio/Video`, `Dataset`, `Image`, `Model`, `Software`, `Book`, `Funding Submission`, `Journal Article`, `Lesson`, `Poster`, `Preprint`, `Presentation`, `Research Tool`, `Thesis`, `Other` |
| `file_description` | string | ファイルの説明文 |
| `related_publication_doi` | string | 関連出版物の DOI（`10.xxxx/yyyy` 形式） |
| `funders` | array | `[{"funding_agency": "...", "grant_number": "..."}]` |

> DataCite v4.0 スキーマの全フィールド（`titles`, `creators`, `subjects`, `descriptions` 等）は定義されていますが、OSF の入力バリデーションにより上記4つ以外は `Additional properties are not allowed` エラーになります。

### 検索との関係

`file_description` に値を設定して検索しましたが、**ヒットしませんでした**。ソースコード `update_file()` にも DataCite メタデータを読み出す処理はなく、**DataCite メタデータは検索インデックスに含まれません**。

---

## まとめ

### 確認できたこと

**API の挙動（実験）:**

- `/api/v1/search/` は Elasticsearch Query DSL ベースの検索 API です
- `file`, `project`, `user` の3カテゴリを横断検索できます
- `_all` 全文検索は `name`, `node_title`, `creator_name`, `tags`, `description` にヒットします
- フィールド指定クエリ（`name:`, `tags:`, `category:`）、ワイルドカード、AND/OR 演算子が使えます
- `term` / `and` / `bool`+`should` フィルタが動作します
- `sort` は `modified_desc/asc`, `created_desc/asc` の4種で動作を確認しました
- `size` は 100 まで動作を確認しました
- ハイライトは `name`, `tags`, `normalized_tags`, `description` で動作を確認しました

**ソースコードから確認:**

- 日本語環境では `kuromoji_analyzer` が使用されます
- `folder_name`, `parent_title`, `parent_url` はインデックスに含まれず、レスポンス時に動的付与されます
- `text` ハイライトフィールドは Wiki ページのコンテンツ用です
- `sort` は `project`, `file`, `wiki`, `user`, `institution`, `created`, `modified` の各方向が定義されています
- `api_version` は `version` 1 と 2、`vendor` は `"grdm"` をサポートしています
- `file`, `project`, `user` 以外に `component`, `registration`, `preprint`, `wiki`, `comment`, `institution` のカテゴリが存在します

### 検索対象外であることを確認

- **テキストファイルの本文**（`.txt` 内の文章）— 実験とソースコードの両方で確認しました
- **DataCite メタデータ**（`file_description` 等）— 実験とソースコードの両方で確認しました
- **`folder_name`**（ストレージプロバイダ名）— 実験とソースコードの両方で確認しました

### 未確認

- `comments` が `_all` 検索でヒットするかどうか
- Wiki コンテンツ（`text` フィールド）の検索動作
- `project_desc` 等のソート値の動作
- `size` の正確な上限
- `bool` + `must` フィルタが 500 エラーとなる原因

---

## 参考リンク

- [RCOSDP/RDM-osf.io](https://github.com/RCOSDP/RDM-osf.io) — GakuNin RDM ソースコード
- [RCOSDP/RDM-developer-guide](https://github.com/RCOSDP/RDM-developer-guide) — 開発者ガイド
- [GakuNin RDM サポートポータル 検索](https://support.rdm.nii.ac.jp/en/usermanual/Search-01/) — ユーザー向け検索マニュアル
- [website/search/elastic_search.py](https://github.com/RCOSDP/RDM-osf.io/blob/develop/website/search/elastic_search.py) — インデックス定義・ドキュメント登録
- [website/search/views.py](https://github.com/RCOSDP/RDM-osf.io/blob/develop/website/search/views.py) — API エンドポイント
- [website/search/util.py](https://github.com/RCOSDP/RDM-osf.io/blob/develop/website/search/util.py) — クエリ構築・ソート定義
