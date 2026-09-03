"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, createCompanyGroup, getAllStudents, StudentListItem } from "@/lib/api";

export default function NewCompanyGroupPage() {
  const router = useRouter(); const [students, setStudents] = useState<StudentListItem[]>([]); const [selected, setSelected] = useState<number[]>([]); const [name, setName] = useState(""); const [body, setBody] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { void getAllStudents().then(setStudents).catch(() => setError("学生一覧を読み込めませんでした。")).finally(() => setLoading(false)); }, []);
  function toggle(id: number) { setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < 20 ? [...current, id] : current); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(""); try { const { data } = await createCompanyGroup({ name, student_ids: selected, body }); router.push(`/companies/groups/${data.id}`); } catch (e: unknown) { setError(e instanceof ApiRequestError ? e.errors[0]?.message ?? "グループを作成できませんでした。" : "グループを作成できませんでした。"); setSaving(false); } }
  return <main className="page-shell"><section className="form-card"><Link className="back-link" href="/companies/groups">← グループ一覧へ戻る</Link><p className="eyebrow">NEW GROUP CHAT</p><h1>グループを作成</h1>{error && <div className="error-banner" role="alert">{error}</div>}{loading ? <p className="loading">学生を読み込んでいます…</p> : <form className="form-grid single-column" onSubmit={submit}><div className="field"><label htmlFor="group-name">グループ名<span className="required-label">必須</span></label><input id="group-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required /></div><fieldset className="student-selection"><legend>参加学生（2〜20人）</legend><p>{selected.length}人選択中</p>{students.map((student) => <label key={student.id}><input type="checkbox" checked={selected.includes(student.id)} onChange={() => toggle(student.id)} disabled={!selected.includes(student.id) && selected.length >= 20} /><span>{student.name} — {student.school_name}</span></label>)}</fieldset><div className="field"><label htmlFor="group-first-message">最初のメッセージ<span className="required-label">必須</span></label><textarea id="group-first-message" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={6} required /></div><button className="primary-button" type="submit" disabled={saving || selected.length < 2}>{saving ? "作成中…" : "グループを作成"}</button></form>}</section></main>;
}
