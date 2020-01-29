# call-on-http TypeScript 向けの RPC

Remote Procedure Call on HTTP

サーバーのコードから

- ブラウザ用のコードが表示されるドキュメントのページ
- Express で使える 型チェックなどを行う middleware のコード

を生成する

API のページへアクセスしたときのコードを信用していいのかという問題はある。call-on-http が生成したドキュメントのブラウザ用コードを、Local Storage などに保存されているアクセストークンを盗むコードに置き換えてしまう場合がある。

.d.ts ファイルだけコピーして使い、api のリンクへ HTTP ヘッダーの accept で application/javascript をリクエストされたときにブラウザ用コードを返してそれを使うようにすれば JavaScript の実行文脈 origin が別になるのでトークンを盗むようなことはできなくなるが…
(ブラウザの script 要素からのリクエストでは accept が*/*になってしまっているのでパスで表現するか)

```html
<script src="https://us-central1-definy-lang.cloudfunctions.net/api/browser-code"></script>
<script>
  window.api.getUser("abcdefg").then(console.log);
</script>
```
