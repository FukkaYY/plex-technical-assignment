"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ApiRequestError,
  CompanyProfile,
  getCurrentUser,
  getStudents,
  logout,
  StudentListItem,
  StudentListMeta,
} from "@/lib/api";

export default function StudentsPage() {
  return (
    <Suspense fallback={<main className="students-shell"><section className="list-state"><p className="loading">学生一覧を読み込んでいます…</p></section></main>}>
      <StudentsContent />
    </Suspense>
  );
}

function StudentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appliedQuery = searchParams.get("query") ?? "";
  const appliedGraduationYear = searchParams.get("graduation_year") ?? "";
  const appliedDesiredRole = searchParams.get("desired_role") ?? "";
  const requestedPage = searchParams.get("page") ?? "1";
  const page = /^\d+$/.test(requestedPage) && Number(requestedPage) > 0 ? Number(requestedPage) : 1;
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [meta, setMeta] = useState<StudentListMeta | null>(null);
  const [query, setQuery] = useState(appliedQuery);
  const [graduationYear, setGraduationYear] = useState(appliedGraduationYear);
  const [desiredRole, setDesiredRole] = useState(appliedDesiredRole);
  const [retryKey, setRetryKey] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      getCurrentUser(),
      getStudents(page, {
        query: appliedQuery,
        graduationYear: appliedGraduationYear,
        desiredRole: appliedDesiredRole,
      }),
    ])
      .then(([currentUserResponse, studentsResponse]) => {
        if (cancelled) return;
        if (currentUserResponse.data.user.role !== "company") {
          router.replace("/students/me");
          return;
        }
        if (!currentUserResponse.data.company_profile) {
          setError("企業プロフィールを表示できません。");
          return;
        }

        setCompanyProfile(currentUserResponse.data.company_profile);
        setStudents(studentsResponse.data);
        setMeta(studentsResponse.meta);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        if (requestError instanceof ApiRequestError) {
          if (requestError.errors.some((item) => item.code === "unauthenticated")) {
            router.replace("/companies/login");
            return;
          }
          if (requestError.errors.some((item) => item.code === "forbidden")) {
            router.replace("/students/me");
            return;
          }
          setError(requestError.errors[0]?.message ?? "学生一覧の読み込みに失敗しました。");
        } else {
          setError("学生一覧の読み込みに失敗しました。");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appliedDesiredRole, appliedGraduationYear, appliedQuery, page, retryKey, router]);

  function changePage(nextPage: number) {
    setError("");
    setIsLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage === 1) params.delete("page");
    else params.set("page", String(nextPage));
    router.push(`/students${params.size > 0 ? `?${params.toString()}` : ""}`);
  }

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    const normalizedQuery = query.trim();
    const normalizedGraduationYear = graduationYear.trim();
    const normalizedDesiredRole = desiredRole.trim();
    if (normalizedQuery) params.set("query", normalizedQuery);
    if (normalizedGraduationYear) params.set("graduation_year", normalizedGraduationYear);
    if (normalizedDesiredRole) params.set("desired_role", normalizedDesiredRole);
    setError("");
    setIsLoading(true);
    router.push(`/students${params.size > 0 ? `?${params.toString()}` : ""}`);
  }

  function clearSearch() {
    setQuery("");
    setGraduationYear("");
    setDesiredRole("");
    setError("");
    setIsLoading(true);
    router.push("/students");
  }

  function retry() {
    setError("");
    setIsLoading(true);
    setRetryKey((current) => current + 1);
  }

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
    <main className="students-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">STUDENT CANDIDATES</p>
          <h1>インターン生一覧</h1>
          {companyProfile && <p className="company-context">{companyProfile.company_name}</p>}
        </div>
        {companyProfile && (
          <button className="secondary-button header-button" type="button" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "ログアウト中…" : "ログアウト"}
          </button>
        )}
      </header>

      <form className="student-search" aria-label="学生検索・絞り込み" onSubmit={applySearch}>
        <div className="student-search-fields">
          <label>
            <span>キーワード</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={100} placeholder="氏名・学校名・希望職種・スキル" />
          </label>
          <label>
            <span>卒業予定年</span>
            <input type="number" value={graduationYear} onChange={(event) => setGraduationYear(event.target.value)} min={new Date().getFullYear()} max={new Date().getFullYear() + 10} placeholder="例: 2028" />
          </label>
          <label>
            <span>希望職種</span>
            <input value={desiredRole} onChange={(event) => setDesiredRole(event.target.value)} maxLength={100} placeholder="完全一致" />
          </label>
        </div>
        <div className="student-search-actions">
          <button className="primary-button" type="submit">検索する</button>
          <button className="secondary-button" type="button" onClick={clearSearch}>条件をクリア</button>
        </div>
      </form>

      {error && (
        <section className="list-state error-state" role="alert">
          <p>{error}</p>
          <button className="secondary-button compact-button" type="button" onClick={retry}>再試行</button>
        </section>
      )}

      {isLoading && <section className="list-state"><p className="loading">学生一覧を読み込んでいます…</p></section>}

      {!isLoading && !error && meta && (
        <>
          <div className="list-summary">
            <p>{hasSearchConditions(appliedQuery, appliedGraduationYear, appliedDesiredRole) ? `${meta.total_count}人が検索条件に一致しました` : `${meta.total_count}人の学生が登録されています`}</p>
            {meta.total_pages > 0 && <p>{meta.page} / {meta.total_pages}ページ</p>}
          </div>

          {students.length === 0 ? (
            <section className="list-state empty-state">
              <h2>{hasSearchConditions(appliedQuery, appliedGraduationYear, appliedDesiredRole) ? "検索条件に一致する学生がいません" : "表示できる学生がいません"}</h2>
              <p>{hasSearchConditions(appliedQuery, appliedGraduationYear, appliedDesiredRole) ? "条件を変更するか、条件をクリアしてください。" : meta.total_count === 0 ? "学生が登録されるとここに表示されます。" : "このページには学生がいません。"}</p>
              {hasSearchConditions(appliedQuery, appliedGraduationYear, appliedDesiredRole) && <button className="secondary-button compact-button" type="button" onClick={clearSearch}>条件をクリア</button>}
            </section>
          ) : (
            <section className="student-grid" aria-label="学生一覧">
              {students.map((student) => <StudentCard key={student.id} student={student} />)}
            </section>
          )}

          {meta.total_pages > 0 && (
            <nav className="pagination" aria-label="学生一覧のページ移動">
              <button type="button" onClick={() => changePage(page - 1)} disabled={!meta.has_previous}>前へ</button>
              <span aria-current="page">{meta.page} / {meta.total_pages}</span>
              <button type="button" onClick={() => changePage(page + 1)} disabled={!meta.has_next}>次へ</button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}

function hasSearchConditions(query: string, graduationYear: string, desiredRole: string) {
  return Boolean(query || graduationYear || desiredRole);
}

function StudentCard({ student }: { student: StudentListItem }) {
  const hiddenSkillCount = student.skills_count - student.skills.length;
  const registeredAt = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(new Date(student.registered_at));

  return (
    <article className="student-card">
      <div className="student-card-heading">
        <div>
          <h2>{student.name}</h2>
          <p>{student.school_name} / {student.graduation_year}年卒業予定</p>
        </div>
        <span className="registered-at">{registeredAt}登録</span>
      </div>
      <p className="desired-role">{student.desired_role}</p>
      <div className="skill-list" aria-label={`スキル ${student.skills_count}件`}>
        {student.skills.map((skill) => <span key={skill}>{skill}</span>)}
        {hiddenSkillCount > 0 && <span>+{hiddenSkillCount}</span>}
      </div>
      <p className="student-introduction">{student.self_introduction_excerpt}</p>
      <Link className="detail-link" href={`/students/${student.id}`}>詳細を見る</Link>
    </article>
  );
}
