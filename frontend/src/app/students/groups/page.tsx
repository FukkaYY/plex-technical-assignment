"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, getStudentGroups, GroupListItem } from "@/lib/api";

export default function StudentGroupsPage() {
  const router = useRouter(); const [groups, setGroups] = useState<GroupListItem[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { void getStudentGroups().then(({ data }) => setGroups(data)).catch((e: unknown) => { if (e instanceof ApiRequestError && e.errors.some((x) => x.code === "unauthenticated")) return router.replace("/students/login"); setError(e instanceof ApiRequestError ? e.errors[0]?.message : "グループを読み込めませんでした。"); }).finally(() => setLoading(false)); }, [router]);
  return <main className="jobs-shell"><Link className="back-link" href="/students/me">← 学生マイページへ戻る</Link><header className="jobs-header"><div><p className="eyebrow">GROUP CHATS</p><h1>グループチャット</h1></div></header>{error && <div className="error-banner" role="alert">{error}</div>}{loading && <p className="loading">グループを読み込んでいます…</p>}{!loading && !error && groups.length === 0 && <section className="list-state empty-state"><h2>参加中のグループはありません</h2></section>}{!loading && groups.length > 0 && <section className="job-list" aria-label="参加中のグループ">{groups.map((group) => <article className="job-card" key={group.id}><p className="company-context">{group.company?.company_name}</p><h2>{group.name}</h2><p>参加学生 {group.student_count}人</p><p>{group.latest_message_excerpt}</p><Link className="detail-link" href={`/students/groups/${group.id}`}>会話を見る</Link></article>)}</section>}</main>;
}
