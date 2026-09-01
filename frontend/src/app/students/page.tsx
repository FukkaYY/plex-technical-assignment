"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, CompanyProfile, getCurrentUser, logout } from "@/lib/api";

export default function StudentsPage() {
  const router = useRouter();
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(({ data }) => {
        if (data.user.role === "student") {
          router.replace("/students/me");
          return;
        }
        if (!data.company_profile) {
          setError("企業プロフィールを表示できません。");
          return;
        }
        setCompanyProfile(data.company_profile);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof ApiRequestError && requestError.errors.some((item) => item.code === "unauthenticated")) {
          router.replace("/companies/login");
          return;
        }
        setError("企業情報の読み込みに失敗しました。");
      });
  }, [router]);

  async function handleLogout() {
    setError("");
    setIsLoggingOut(true);
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
        {!companyProfile && !error && <p className="loading">企業情報を読み込んでいます…</p>}

        {companyProfile && (
          <>
            <div className="success-banner" role="status">企業アカウントでログインしました</div>
            <p className="eyebrow">COMPANY DASHBOARD</p>
            <h1>{companyProfile.company_name}</h1>
            <p className="intro">学生一覧は次の実装単位で追加します。</p>
            <button className="secondary-button" type="button" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "ログアウト中…" : "ログアウト"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
