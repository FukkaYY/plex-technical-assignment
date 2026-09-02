import Link from "next/link";

export default function Home() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">PLEX INTERN SCOUT</p>
        <h1>あなたの可能性と、企業をつなぐ。</h1>
        <p>プロフィールを登録して、インターンのスカウトを受け取りましょう。</p>
        <div className="actions">
          <Link className="primary-link" href="/students/register">インターン生として登録</Link>
          <Link className="secondary-link" href="/students/login">学生ログイン</Link>
          <Link className="secondary-link" href="/companies/login">企業ログイン</Link>
        </div>
      </section>
    </main>
  );
}
