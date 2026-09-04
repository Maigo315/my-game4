# ローグ 戦闘Prototype 0.1

ブラウザで動く、戦闘部分だけのPrototypeです。

## まず遊ぶ

`index.html` をダブルクリックすると、ブラウザで開けます。

## GitHub Pagesで公開する手順

1. GitHubで新しいリポジトリを作成します。
2. このフォルダの**中身を全部**アップロードします。
   - `index.html`
   - `style.css`
   - `script.js`
   - `assets` フォルダ
   - `README.md`
3. GitHubのリポジトリ画面で `Settings` を開きます。
4. 左側メニューから `Pages` を開きます。
5. `Build and deployment` の `Source` を `Deploy from a branch` にします。
6. Branch を `main`、Folder を `/(root)` にして保存します。
7. 公開処理が完了すると、GitHub PagesのURLが表示されます。

## フォルダ構成

```text
index.html
style.css
script.js
README.md
assets/
  slime.webp
  fairy.webp
  golem.webp
  poison_slime.webp
  lamia.webp
```

重要なのは、`index.html` がリポジトリの一番上にあることです。

## 現在のPrototype仕様

- プレイヤーHP 100
- コマンド
  - 攻撃
  - 防御
  - アイテム
  - スキル（未実装）
- 武器
  - 木の棒
  - 鉄の剣
  - 騎士の剣
- 盾
  - 木の盾
  - 鉄の盾
  - 騎士の盾
- 敵
  - スライム娘
  - フェアリー
  - ゴーレム娘
  - ポイズンスライム
  - ラミア
- アイテム
  - 薬草
  - 上薬草
  - 毒消し草
  - 毒薬
  - 炎の杖
  - 爆弾

## 戦闘ルール

- 物理ダメージ = `max(1, 攻撃力 - 防御力)`
- 防御 = そのターンの直接ダメージを半減
- 毒 = ターン終了時に毒値ぶんダメージ、その後毒値-1
- 固定ダメージは防御力を無視
- 戦闘終了時に毒は解除

## 今後の追加候補

このPrototypeを土台にして、少しずつ以下を追加していく想定です。

- 3択イベント
- 宝箱
- 魔物娘遭遇
- 店
- 合成炉
- 休憩
- 装備・印
- 24ターンのラン
