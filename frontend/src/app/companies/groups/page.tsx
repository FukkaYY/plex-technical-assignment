"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, getCompanyGroups, GroupListItem } from "@/lib/api";

export default function CompanyGroupsPage() {
  const router = useRouter(); const [groups, setGroups] = useState<GroupListItem[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { void getCompanyGroups().then(({ data }) => setGroups(data)).catch((e: unknown) => { if (e instanceof ApiRequestError && e.errors.some((x) => x.code === "unauthenticated")) return router.replace("/companies/login"); setError(e instanceof ApiRequestError ? e.errors[0]?.message : "グループを読み込めませんでした。"); }).finally(() => setLoading(false)); }, [router]);
  return <main className="jobs-shell"><Link className="back-link" href="/students">← 学生一覧へ戻る</Link><header className="jobs-header"><div><p className="eyebrow">GROUP CHATS</p><h1>グループチャット</h1></div><Link className="primary-link" href="/companies/groups/new">グループを作成</Link></header>{error && <div className="error-banner" role="alert">{error}</div>}{loading && <p className="loading">グループを読み込んでいます…</p>}{!loading && !error && groups.length === 0 && <section className="list-state empty-state"><h2>グループはまだありません</h2></section>}{!loading && groups.length > 0 && <section className="job-list" aria-label="自社のグループ">{groups.map((group) => <article className="job-card" key={group.id}><h2>{group.name}</h2><p>参加学生 {group.student_count}人</p><p>{group.latest_message_excerpt}</p><Link className="detail-link" href={`/companies/groups/${group.id}`}>会話を見る</Link></article>)}</section>}</main>;
}
