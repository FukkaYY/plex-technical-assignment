"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, getCurrentUser, logout, StudentProfile, updateStudentProfileVisibility } from "@/lib/api";

export default function StudentMyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

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
        if (new URLSearchParams(window.location.search).get("updated") === "1") {
          setNotice("プロフィールを更新しました。");
          window.history.replaceState(null, "", "/students/me");
        }
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

  async function handleVisibilityChange() {
    if (!profile) return;

    const nextVisibility = !profile.visible_to_companies;
    setError("");
    setNotice("");
    setIsUpdatingVisibility(true);
    try {
      const response = await updateStudentProfileVisibility(nextVisibility);
      setProfile(response.data);
      setNotice(nextVisibility ? "プロフィールを企業へ公開しました。" : "プロフィールを企業から非公開にしました。");
    } catch (requestError) {
      setError(requestError instanceof ApiRequestError ? requestError.errors[0]?.message ?? "公開状態の変更に失敗しました。" : "公開状態の変更に失敗しました。");
    } finally {
      setIsUpdatingVisibility(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="profile-card" aria-live="polite">
        {error && <div className="error-banner" role="alert">{error}</div>}
        {notice && <div className="success-banner" role="status">{notice}</div>}

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
            <section className="profile-visibility" aria-labelledby="profile-visibility-heading">
              <div>
                <h2 id="profile-visibility-heading">企業への公開状態</h2>
                <p className={profile.visible_to_companies ? "visibility-status visible" : "visibility-status private"}>
                  {profile.visible_to_companies ? "公開中" : "非公開"}
                </p>
                <p>{profile.visible_to_companies ? "企業の学生一覧と検索結果にプロフィールが表示されます。" : "企業の学生一覧・検索結果・学生詳細には表示されません。既存の会話は引き続き利用できます。"}</p>
              </div>
              <button className="secondary-button compact-button" type="button" onClick={handleVisibilityChange} disabled={isUpdatingVisibility}>
                {isUpdatingVisibility ? "変更中…" : profile.visible_to_companies ? "プロフィールを非公開にする" : "プロフィールを公開する"}
              </button>
            </section>
            <div className="actions">
              <Link className="primary-link" href="/students/messages">受信メッセージを見る</Link>
              <Link className="secondary-link" href="/students/jobs">インターン募集を見る</Link>
              <Link className="secondary-link" href="/students/groups">グループチャットを見る</Link>
              <Link className="secondary-link" href="/students/me/edit">プロフィールを編集</Link>
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
