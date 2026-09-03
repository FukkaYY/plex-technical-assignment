"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, getStudentJobPostings, StudentJobPosting } from "@/lib/api";

export default function StudentJobsPage() {
  const router = useRouter();
  const [postings, setPostings] = useState<StudentJobPosting[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { void getStudentJobPostings().then(({ data }) => setPostings(data)).catch((requestError: unknown) => {
    if (requestError instanceof ApiRequestError) {
      if (requestError.errors.some((item) => item.code === "unauthenticated")) return router.replace("/students/login");
      if (requestError.errors.some((item) => item.code === "forbidden")) return router.replace("/students");
      setError(requestError.errors[0]?.message ?? "募集を読み込めませんでした。");
    } else setError("募集を読み込めませんでした。");
  }).finally(() => setIsLoading(false)); }, [router]);

  return <main className="jobs-shell"><Link className="back-link" href="/students/me">← 学生マイページへ戻る</Link><header className="jobs-header"><div><p className="eyebrow">INTERNSHIP JOBS</p><h1>インターン募集</h1><p>企業が公開している募集を確認できます。</p></div></header>{error && <div className="error-banner" role="alert">{error}</div>}{isLoading && <section className="list-state"><p className="loading">募集を読み込んでいます…</p></section>}{!isLoading && !error && postings.length === 0 && <section className="list-state empty-state"><h2>公開中の募集はありません</h2></section>}{!isLoading && !error && postings.length > 0 && <section className="job-list" aria-label="公開中の募集">{postings.map((posting) => <article className="job-card" key={posting.id}><p className="company-context">{posting.company.company_name}</p><h2>{posting.title}</h2><p className="job-role">{posting.role_name}</p><p>{posting.work_location}</p><Link className="detail-link" href={`/students/jobs/${posting.id}`}>募集詳細を見る</Link></article>)}</section>}</main>;
}
