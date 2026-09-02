"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ApiRequestError,
  getStudentMessages,
  MessageItem,
  sendStudentMessage,
} from "@/lib/api";

const MAX_BODY_LENGTH = 2_000;

export default function StudentMessagesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [sendError, setSendError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void getStudentMessages(params.id)
      .then(({ data }) => {
        if (cancelled) return;
        setStudentName(data.student.name);
        setMessages(data.messages);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        handleAccessError(requestError, router, () => setIsNotFound(true), setLoadError);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id, retryKey, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedBody = body.trim();
    if (!normalizedBody || normalizedBody.length > MAX_BODY_LENGTH || isSending) return;

    setSendError("");
    setIsSending(true);
    try {
      const response = await sendStudentMessage(params.id, body);
      setMessages((current) => [...current, response.data.message]);
      setBody("");
    } catch (requestError: unknown) {
      handleAccessError(requestError, router, () => setIsNotFound(true), setSendError);
    } finally {
      setIsSending(false);
    }
  }

  function retry() {
    setLoadError("");
    setIsNotFound(false);
    setIsLoading(true);
    setRetryKey((current) => current + 1);
  }

  const normalizedLength = body.trim().length;
  const canSend = normalizedLength > 0 && normalizedLength <= MAX_BODY_LENGTH && !isSending;

  return (
    <main className="message-shell">
      <Link className="back-link" href={`/students/${params.id}`}>← 学生詳細へ戻る</Link>

      {isLoading && <section className="list-state"><p className="loading">メッセージ履歴を読み込んでいます…</p></section>}

      {!isLoading && isNotFound && (
        <section className="list-state">
          <p className="eyebrow">404 NOT FOUND</p>
          <h1>学生が見つかりません</h1>
          <p>対象の学生は存在しないか、削除された可能性があります。</p>
        </section>
      )}

      {!isLoading && loadError && (
        <section className="list-state error-state" role="alert">
          <h1>メッセージ履歴を表示できません</h1>
          <p>{loadError}</p>
          <button className="secondary-button compact-button" type="button" onClick={retry}>再試行</button>
        </section>
      )}

      {!isLoading && !isNotFound && !loadError && (
        <div className="message-layout">
          <header className="message-header">
            <p className="eyebrow">SCOUT MESSAGE</p>
            <h1>{studentName}さんへのメッセージ</h1>
            <p>送信したメッセージは学生本人が受信画面から確認できます。</p>
          </header>

          <section className="message-history" aria-label="送信履歴">
            <h2>送信履歴</h2>
            {messages.length === 0 ? (
              <div className="message-empty">
                <p>まだメッセージを送信していません。</p>
              </div>
            ) : (
              <ol>
                {messages.map((message) => (
                  <li key={message.id}>
                    <p>{message.body}</p>
                    <time dateTime={message.sent_at}>{formatSentAt(message.sent_at)}</time>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <form className="message-form" onSubmit={handleSubmit}>
            <label htmlFor="message-body">メッセージ本文</label>
            <textarea
              id="message-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={MAX_BODY_LENGTH}
              rows={8}
              disabled={isSending}
              aria-describedby="message-count"
              required
            />
            <div className="message-form-footer">
              <span id="message-count">{body.length} / {MAX_BODY_LENGTH}文字</span>
              <button className="primary-button" type="submit" disabled={!canSend}>
                {isSending ? "送信中…" : "メッセージを送信"}
              </button>
            </div>
            {sendError && <div className="error-banner send-error" role="alert">{sendError} 入力内容を保持しています。</div>}
          </form>
        </div>
      )}
    </main>
  );
}

function handleAccessError(
  requestError: unknown,
  router: ReturnType<typeof useRouter>,
  onNotFound: () => void,
  setError: (message: string) => void,
) {
  if (requestError instanceof ApiRequestError) {
    if (requestError.errors.some((item) => item.code === "unauthenticated")) {
      router.replace("/companies/login");
      return;
    }
    if (requestError.errors.some((item) => item.code === "forbidden")) {
      router.replace("/students/me");
      return;
    }
    if (requestError.errors.some((item) => item.code === "not_found")) {
      onNotFound();
      return;
    }
    setError(requestError.errors[0]?.message ?? "メッセージの処理に失敗しました。");
    return;
  }
  setError("メッセージの処理に失敗しました。");
}

function formatSentAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
