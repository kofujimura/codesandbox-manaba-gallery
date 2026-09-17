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

## デプロイ
`index.html` 1 ファイルの静的サイトです。サーバー処理は一切なく、Excel の解析はブラウザ内 (SheetJS) で行うため、
GitHub Pages / Vercel のどちらでもそのまま動きます。ファイルは外部に送信されません。

- **GitHub Pages**: このフォルダをリポジトリにして Settings → Pages → Branch: main / root
- **Vercel**: `vercel` コマンドまたは Git 連携でこのフォルダをデプロイ（Framework Preset: Other）
