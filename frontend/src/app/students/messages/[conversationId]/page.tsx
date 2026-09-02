"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiRequestError, ConversationDetail, getConversation } from "@/lib/api";

export default function StudentMessageDetailPage() {
  const params = useParams<{ conversationId: string }>();
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void getConversation(params.conversationId)
      .then(({ data }) => {
        if (!cancelled) setConversation(data);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        if (requestError instanceof ApiRequestError) {
          if (requestError.errors.some((item) => item.code === "unauthenticated")) {
            router.replace("/students/login");
            return;
          }
          if (requestError.errors.some((item) => item.code === "forbidden")) {
            router.replace("/students");
            return;
          }
          if (requestError.errors.some((item) => item.code === "not_found")) {
            setIsNotFound(true);
            return;
          }
          setError(requestError.errors[0]?.message ?? "メッセージの読み込みに失敗しました。");
          return;
        }
        setError("メッセージの読み込みに失敗しました。");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.conversationId, retryKey, router]);

  function retry() {
    setConversation(null);
    setError("");
    setIsNotFound(false);
    setIsLoading(true);
    setRetryKey((current) => current + 1);
  }

  return (
    <main className="message-shell">
      <Link className="back-link" href="/students/messages">← 受信メッセージへ戻る</Link>

      {isLoading && <section className="list-state"><p className="loading">メッセージを読み込んでいます…</p></section>}

      {!isLoading && isNotFound && (
        <section className="list-state">
          <p className="eyebrow">404 NOT FOUND</p>
          <h1>会話が見つかりません</h1>
          <p>この会話は存在しないか、閲覧できません。</p>
        </section>
      )}

      {!isLoading && error && (
        <section className="list-state error-state" role="alert">
          <h1>メッセージを表示できません</h1>
          <p>{error}</p>
          <button className="secondary-button compact-button" type="button" onClick={retry}>再試行</button>
        </section>
      )}

      {!isLoading && conversation && (
        <article className="received-conversation">
          <header className="message-header">
            <p className="eyebrow">MESSAGE FROM</p>
            <h1>{conversation.company.company_name}</h1>
            <p>この画面では受信内容を確認できます。学生からの返信は現在利用できません。</p>
          </header>
          <section className="received-message-history" aria-label="受信メッセージ履歴">
            {conversation.messages.map((message) => (
              <div className="received-message" key={message.id}>
                <p>{message.body}</p>
                <time dateTime={message.sent_at}>{formatSentAt(message.sent_at)}</time>
              </div>
            ))}
          </section>
        </article>
      )}
    </main>
  );
}

function formatSentAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
