export default function Home() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">PLEX INTERN SCOUT</p>
        <h1>開発環境の準備ができました</h1>
        <p>
          次は、必須機能の最初の単位であるインターン生登録を実装します。
        </p>
        <a href="/api/v1/health">Rails APIの疎通を確認</a>
      </section>
    </main>
  );
}
