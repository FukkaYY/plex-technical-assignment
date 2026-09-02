"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, getCurrentUser, logout, StudentProfile } from "@/lib/api";

export default function StudentMyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(({ data }) => {
        if (data.user.role !== "student") {
          router.replace("/students");
          return;
        }
        if (!data.student_profile) {
          setError("学生プロフィールを表示できません。");
          return;
        }
        setProfile(data.student_profile);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof ApiRequestError && requestError.errors.some((item) => item.code === "unauthenticated")) {
          router.replace("/students/login");
          return;
        }
        setError("プロフィールの読み込みに失敗しました。");
      });
  }, [router]);

  async function handleLogout() {
    setIsLoggingOut(true);
    setError("");
    try {
      await logout();
      router.replace("/");
    } catch {
      setError("ログアウトに失敗しました。");
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="profile-card" aria-live="polite">
        {error && <div className="error-banner" role="alert">{error}</div>}

        {!profile && !error && <p className="loading">プロフィールを読み込んでいます…</p>}

        {profile && (
          <>
            <p className="eyebrow">STUDENT MY PAGE</p>
            <h1>{profile.name}さん</h1>
            <p className="intro">登録プロフィールと企業から届いたメッセージを確認できます。</p>
            <dl className="profile-summary">
              <div><dt>学校名</dt><dd>{profile.school_name}</dd></div>
              <div><dt>卒業予定</dt><dd>{profile.graduation_year}年</dd></div>
              <div><dt>希望職種</dt><dd>{profile.desired_role}</dd></div>
            </dl>
            <div className="actions">
              <Link className="primary-link" href="/students/messages">受信メッセージを見る</Link>
              <button className="secondary-button" type="button" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "ログアウト中…" : "ログアウト"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
