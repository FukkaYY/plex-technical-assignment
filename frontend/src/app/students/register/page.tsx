"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, registerStudent } from "@/lib/api";

type FormValues = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  schoolName: string;
  graduationYear: string;
  desiredRole: string;
  skills: string;
  selfIntroduction: string;
};

const initialValues: FormValues = {
  name: "",
  email: "",
  password: "",
  passwordConfirmation: "",
  schoolName: "",
  graduationYear: "",
  desiredRole: "",
  skills: "",
  selfIntroduction: "",
};

export default function StudentRegistrationPage() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      await registerStudent({
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.passwordConfirmation,
        school_name: values.schoolName,
        graduation_year: Number(values.graduationYear),
        desired_role: values.desiredRole,
        skills: values.skills.split(","),
        self_introduction: values.selfIntroduction,
      });
      router.push("/students/me");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const fieldErrors: Record<string, string> = {};
        for (const item of error.errors) {
          const frontendField = item.field.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
          fieldErrors[frontendField] ??= item.message;
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ base: "通信に失敗しました。時間をおいて再度お試しください。" });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="form-card" aria-labelledby="registration-title">
        <p className="eyebrow">STUDENT REGISTRATION</p>
        <h1 id="registration-title">インターン生登録</h1>
        <p className="intro">企業があなたの経験を知れるように、プロフィールを登録してください。</p>

        {errors.base && <div className="error-banner" role="alert">{errors.base}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <Field label="氏名" name="name" required error={errors.name}>
              <input id="name" value={values.name} onChange={(event) => update("name", event.target.value)} maxLength={100} autoComplete="name" required />
            </Field>

            <Field label="メールアドレス" name="email" required error={errors.email} wide>
              <input id="email" type="email" value={values.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" required />
            </Field>

            <Field label="パスワード" name="password" hint="8文字以上" required error={errors.password}>
              <input id="password" type="password" value={values.password} onChange={(event) => update("password", event.target.value)} minLength={8} autoComplete="new-password" required />
            </Field>

            <Field label="パスワード確認" name="passwordConfirmation" required error={errors.passwordConfirmation}>
              <input id="passwordConfirmation" type="password" value={values.passwordConfirmation} onChange={(event) => update("passwordConfirmation", event.target.value)} minLength={8} autoComplete="new-password" required />
            </Field>

            <Field label="学校名" name="schoolName" required error={errors.schoolName}>
              <input id="schoolName" value={values.schoolName} onChange={(event) => update("schoolName", event.target.value)} maxLength={200} autoComplete="organization" required />
            </Field>

            <Field label="卒業予定年" name="graduationYear" required error={errors.graduationYear}>
              <input id="graduationYear" type="number" value={values.graduationYear} onChange={(event) => update("graduationYear", event.target.value)} min={new Date().getFullYear()} max={new Date().getFullYear() + 10} inputMode="numeric" required />
            </Field>

            <Field label="希望職種" name="desiredRole" required error={errors.desiredRole} wide>
              <input id="desiredRole" value={values.desiredRole} onChange={(event) => update("desiredRole", event.target.value)} maxLength={100} placeholder="例: バックエンドエンジニア" required />
            </Field>

            <Field label="スキル" name="skills" hint="カンマ区切り、最大20件" error={errors.skills} wide>
              <input id="skills" value={values.skills} onChange={(event) => update("skills", event.target.value)} placeholder="Ruby, TypeScript, PostgreSQL" />
            </Field>

            <Field label="自己紹介" name="selfIntroduction" hint="2,000文字以内" required error={errors.selfIntroduction} wide>
              <textarea id="selfIntroduction" value={values.selfIntroduction} onChange={(event) => update("selfIntroduction", event.target.value)} maxLength={2000} rows={6} required />
            </Field>
          </div>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "登録中…" : "プロフィールを登録"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  hint,
  required,
  error,
  wide,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const descriptionId = error ? `${name}-error` : hint ? `${name}-hint` : undefined;

  return (
    <div className={`field${wide ? " field-wide" : ""}`}>
      <label htmlFor={name}>
        {label} {required && <span className="required-label">必須</span>}
      </label>
      {hint && <span id={`${name}-hint`} className="field-hint">{hint}</span>}
      <div aria-describedby={descriptionId} aria-invalid={Boolean(error)}>{children}</div>
      {error && <p id={`${name}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}
