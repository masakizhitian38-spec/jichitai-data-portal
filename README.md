# 全国自治体データポータル

全国1,741市区町村の公開統計（e-Stat・社人研ほか）を一括収集し、分野別タブ・経年グラフ・県内/全国比較・似ている自治体などで横断的に見られる単一ページのデータポータルです。

## 公開（GitHub Pages）手順
1. GitHubで空のリポジトリを作成（例: `jichitai-data-portal`）。
2. このフォルダ（`公開_github`）の中身をそのリポジトリにpush（下記）。
3. GitHubの **Settings → Pages** で「Branch: main / (root)」を選択して保存。
4. 数分後 `https://<ユーザー名>.github.io/<リポジトリ名>/` で公開されます。

```bash
cd 公開_github
git init && git add -A && git commit -m "publish"
git branch -M main
git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
git push -u origin main
```

- `.nojekyll` は、アンダースコア始まりのファイル/フォルダがGitHub Pagesで無視されるのを防ぐために置いています（削除しないでください）。
- `index.html` がトップページ（全データ内蔵・約9MB）。`自治体別/…` に詳細版（狭山市）。

## 更新（再生成）
データやUIを更新したら、リポジトリ親側のスクリプトで `index.html` を作り直してこのフォルダへコピーします。フォーム/GAを反映する場合は引数を付けます：

```bash
python skill_自治体ダッシュボード/scripts/build_portal.py \
  --master 自治体別/_マスター/全自治体マスターデータ.csv \
  --status 自治体別/_マスター/status.json \
  --colmeta 自治体別/_マスター/列メタ_実数.json \
  --popseries 自治体別/_マスター/人口時系列.json \
  --similar 自治体別/_マスター/類似自治体.json \
  --tsdata 自治体別/_マスター/時系列データ.json \
  --tsmeta 自治体別/_マスター/時系列メタ.json \
  --natavg 自治体別/_マスター/時系列_全国平均.json \
  --defs 自治体別/_マスター/用語定義.json \
  --feedback-url "https://forms.gle/あなたのフォーム" \
  --ga-id "G-XXXXXXXXXX" \
  --out 公開_github/index.html
```

## 出典
総務省 e-Stat（国勢調査・社会人口統計体系）、国立社会保障・人口問題研究所（地域別将来推計人口）ほか。各ページ下部「出典」に明記。
