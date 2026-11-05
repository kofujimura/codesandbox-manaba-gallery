# 作品ギャラリー (manaba レポート → CodeSandbox 一覧)

manaba からダウンロードしたレポート Excel (`report-….xlsx`) をドロップすると、
P 列のテキストから CodeSandbox のプレビュー URL を抽出し、iframe で作品一覧を表示します。

- `https://xxxxxx.csb.app/...` → そのまま使用
- `https://codesandbox.io/p/sandbox/…-xxxxxx` (エディター URL) → `https://xxxxxx.csb.app/` に変換
- URL 以外の文章は除去（採点モードでは「メモ」として表示）
- 8 行目以降・ロールが「履修生」の行のみ対象

## モード
- **授業モード**: 番号のみ表示（氏名・学籍番号は非表示）。URL のない学生は表示しない
- **採点モード**: 氏名・学籍番号・提出日時・元テキスト・エディターへのリンクを表示。未提出者も表示

「拡大」で 1 作品を全画面表示。← → キーで前後に移動、Esc で閉じる。

読み込んだデータはブラウザの localStorage に保存されるので、リロードしても再アップロード不要です。
「別のファイルを読み込む」で消去できます。

## 学生閲覧用サイト (Vercel)
採点サイトの「学生閲覧用に転送」ボタンで、**CodeSandbox のプレビュー URL の配列とタイトルだけ**を
Vercel 上の学生用ページに送ります（氏名・学籍番号・提出日時・メモは送信しません）。
学生は共有された `https://<プロジェクト>.vercel.app/g/<ID>` を開くと、授業モードと同じ番号順で作品を操作できます。

- `vercel/index.html` … 学生用ページ
- `vercel/api/galleries.js` … Vercel Function。データは **Private** Vercel Blob の `galleries/<ID>.json` に保存
  - `GET ?id=` 学生ページ用 / `POST` 転送・更新（要トークン） / `DELETE ?id=` 公開停止（要トークン）
  - 受け付ける URL は `https://xxxx.csb.app/...` 形式のみ。ID はランダム 12 文字で、一覧 API はありません

### セットアップ
1. Vercel で このリポジトリを Import し、**Root Directory を `vercel`** にする（Framework Preset: Other）
2. Storage → Blob で **Private** のストアを作成してプロジェクトに接続（`BLOB_READ_WRITE_TOKEN` が自動設定される）
3. Settings → Environment Variables に追加して再デプロイ
   - `ADMIN_TOKEN` … 転送用の合言葉（長いランダム文字列。例: `openssl rand -hex 24`）
   - `ALLOWED_ORIGIN` … 採点サイトのオリジン。カンマ区切りで複数可（既定 `https://web.fujimura.com,https://kofujimura.github.io` なら不要）
4. 採点サイトで「学生閲覧用に転送」→ 転送先 `https://<プロジェクト>.vercel.app` とトークンを入力（このブラウザに保存）

同じタイトルで再度転送すると同じリンクのまま内容が更新されます。「公開停止」でBlobから削除します。

## デプロイ
`index.html` 1 ファイルの静的サイトです。サーバー処理は一切なく、Excel の解析はブラウザ内 (SheetJS) で行うため、
GitHub Pages / Vercel のどちらでもそのまま動きます。ファイルは外部に送信されません。

- **GitHub Pages**: このフォルダをリポジトリにして Settings → Pages → Branch: main / root
- `vercel/` フォルダは `_config.yml` で GitHub Pages の公開対象から除外しています
