"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiRequestError, getCurrentUser } from "@/lib/api";

export default function StudentDetailPlaceholderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentUser()
      .then(({ data }) => {
        if (data.user.role !== "company") {
          router.replace("/students/me");
          return;
        }
        setIsAuthorized(true);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof ApiRequestError && requestError.errors.some((item) => item.code === "unauthenticated")) {
          router.replace("/companies/login");
          return;
        }
        setError("ログイン状態の確認に失敗しました。");
      });
  }, [router]);

  return (
    <main className="page-shell">
      <section className="profile-card">
        {error && <div className="error-banner" role="alert">{error}</div>}
        {!isAuthorized && !error && <p className="loading">ログイン状態を確認しています…</p>}
        {isAuthorized && (
          <>
            <p className="eyebrow">STUDENT #{params.id}</p>
            <h1>学生詳細は準備中です</h1>
            <p className="intro">学生プロフィールの詳細表示は次の実装単位で追加します。</p>
            <Link className="secondary-link" href="/students">学生一覧へ戻る</Link>
          </>
        )}
      </section>
    </main>
  );
}
