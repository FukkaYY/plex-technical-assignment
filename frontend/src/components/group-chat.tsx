"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, getCompanyGroup, getStudentGroup, GroupConversationDetail, sendCompanyGroupMessage, sendStudentGroupMessage } from "@/lib/api";

export default function GroupChat({ id, role }: { id: string; role: "company" | "student" }) {
  const router = useRouter();
  const [group, setGroup] = useState<GroupConversationDetail | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const request = role === "company" ? getCompanyGroup(id) : getStudentGroup(id);
    void request.then(({ data }) => setGroup(data)).catch((requestError: unknown) => handleError(requestError, role, router, setError));
  }, [id, role, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() || isSending) return;
    setIsSending(true);
    setSendError("");
    try {
      const { data } = role === "company" ? await sendCompanyGroupMessage(id, body) : await sendStudentGroupMessage(id, body);
      setGroup((current) => current ? { ...current, messages: [...current.messages, data] } : current);
      setBody("");
    } catch (requestError: unknown) {
      handleError(requestError, role, router, setSendError);
    } finally {
      setIsSending(false);
    }
  }

  const backPath = role === "company" ? "/companies/groups" : "/students/groups";
  return <main className="message-shell"><Link className="back-link" href={backPath}>← グループ一覧へ戻る</Link>{error && <section className="list-state error-state" role="alert"><h1>グループを表示できません</h1><p>{error}</p></section>}{!group && !error && <section className="list-state"><p className="loading">グループを読み込んでいます…</p></section>}{group && <div className="message-layout"><header className="message-header"><p className="eyebrow">GROUP CHAT</p><h1>{group.name}</h1>{group.company && <p>{group.company.company_name}</p>}<p>参加学生: {group.students.map((student) => student.name).join("、")}</p></header><section className="message-history" aria-label="グループ会話履歴"><h2>会話履歴</h2><ol>{group.messages.map((message) => <li className={message.sender_role === "student" ? "message-from-student" : "message-from-company"} key={message.id}><strong>{message.sender_name}</strong><p>{message.body}</p><time dateTime={message.sent_at}>{formatSentAt(message.sent_at)}</time></li>)}</ol></section><form className="message-form" aria-label="グループメッセージフォーム" onSubmit={submit}><label htmlFor="group-message-body">メッセージ本文</label><textarea id="group-message-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={6} disabled={isSending} required /><div className="message-form-footer"><span>{body.length} / 2000文字</span><button className="primary-button" type="submit" disabled={!body.trim() || isSending}>{isSending ? "送信中…" : "メッセージを送信"}</button></div>{sendError && <div className="error-banner" role="alert">{sendError}</div>}</form></div>}</main>;
}

function handleError(error: unknown, role: "company" | "student", router: ReturnType<typeof useRouter>, setError: (message: string) => void) {
  if (error instanceof ApiRequestError) {
    if (error.errors.some((item) => item.code === "unauthenticated")) return router.replace(role === "company" ? "/companies/login" : "/students/login");
    if (error.errors.some((item) => item.code === "forbidden")) return router.replace(role === "company" ? "/students/me" : "/students");
    setError(error.errors[0]?.message ?? "グループの処理に失敗しました。");
  } else setError("グループの処理に失敗しました。");
}

function formatSentAt(value: string) { return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
