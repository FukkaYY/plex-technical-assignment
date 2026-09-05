"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, getCurrentUser, getEducationOptions, updateStudentProfile, type EducationOptions } from "@/lib/api";
import { EducationFields, type EducationValues } from "@/components/EducationFields";

type FormValues = {
  lastName: string;
  firstName: string;
  education: EducationValues;
  graduationYear: string;
  desiredRole: string;
  skills: string;
  selfIntroduction: string;
};

const initialValues: FormValues = {
  lastName: "",
  firstName: "",
  education: { schoolType: "", schoolQuery: "", schoolId: "", facultyId: "", departmentId: "" },
  graduationYear: "",
  desiredRole: "",
  skills: "",
  selfIntroduction: "",
};

export default function StudentProfileEditPage() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [educationOptions, setEducationOptions] = useState<EducationOptions | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([getCurrentUser(), getEducationOptions()])
      .then(([{ data }, { data: options }]) => {
        if (cancelled) return;
        if (data.user.role !== "student") {
          router.replace("/students");
          return;
        }
        if (!data.student_profile) {
          setErrors({ base: "学生プロフィールを表示できません。" });
          return;
        }

        const profile = data.student_profile;
        setEducationOptions(options);
        setValues({
          lastName: profile.last_name ?? profile.name.split(" ")[0] ?? "",
          firstName: profile.first_name ?? profile.name.split(" ").slice(1).join(" "),
          education: { schoolType: profile.school_type ?? "", schoolQuery: "", schoolId: profile.school_id ? String(profile.school_id) : "", facultyId: profile.faculty_id ? String(profile.faculty_id) : "", departmentId: profile.department_id ? String(profile.department_id) : "" },
          graduationYear: String(profile.graduation_year),
          desiredRole: profile.desired_role,
          skills: profile.skills.join(", "),
          selfIntroduction: profile.self_introduction,
        });
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        if (requestError instanceof ApiRequestError && requestError.errors.some((item) => item.code === "unauthenticated")) {
          router.replace("/students/login");
          return;
        }
        setErrors({ base: "プロフィールの読み込みに失敗しました。" });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

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
      await updateStudentProfile({
        last_name: values.lastName,
        first_name: values.firstName,
        school_id: Number(values.education.schoolId),
        faculty_id: values.education.facultyId ? Number(values.education.facultyId) : null,
        department_id: values.education.departmentId ? Number(values.education.departmentId) : null,
        graduation_year: Number(values.graduationYear),
        desired_role: values.desiredRole,
        skills: values.skills.split(","),
        self_introduction: values.selfIntroduction,
      });
      router.push("/students/me?updated=1");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.errors.some((item) => item.code === "unauthenticated")) {
          router.replace("/students/login");
          return;
        }
        if (error.errors.some((item) => item.code === "forbidden")) {
          router.replace("/students");
          return;
        }

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
      <section className="form-card" aria-labelledby="profile-edit-title">
        <p className="eyebrow">EDIT STUDENT PROFILE</p>
        <h1 id="profile-edit-title">プロフィール編集</h1>
        <p className="intro">企業に表示されるプロフィール情報を更新できます。</p>

        {errors.base && <div className="error-banner" role="alert">{errors.base}</div>}
        {isLoading && <p className="loading">プロフィールを読み込んでいます…</p>}

        {!isLoading && !errors.base && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid single-column">
              <div className="name-fields">
                <Field label="姓（Family name）" name="lastName" required error={errors.lastName}><input id="lastName" value={values.lastName} onChange={(event) => update("lastName", event.target.value)} maxLength={50} autoComplete="family-name" required /></Field>
                <Field label="名（Given name）" name="firstName" required error={errors.firstName}><input id="firstName" value={values.firstName} onChange={(event) => update("firstName", event.target.value)} maxLength={50} autoComplete="given-name" required /></Field>
              </div>

              <EducationFields options={educationOptions} values={values.education} errors={errors} onChange={(education) => setValues((current) => ({ ...current, education }))} />

              <Field label="卒業予定年" name="graduationYear" required error={errors.graduationYear}>
                <select id="graduationYear" value={values.graduationYear} onChange={(event) => update("graduationYear", event.target.value)} required>{[0, 1, 2].map((offset) => { const year = new Date().getFullYear() + offset; return <option key={year} value={year}>{year}年</option>; })}</select>
              </Field>

              <Field label="希望職種" name="desiredRole" required error={errors.desiredRole} wide>
                <input id="desiredRole" value={values.desiredRole} onChange={(event) => update("desiredRole", event.target.value)} maxLength={100} required />
              </Field>

              <Field label="スキル" name="skills" hint="カンマ区切り、最大20件" error={errors.skills} wide>
                <input id="skills" value={values.skills} onChange={(event) => update("skills", event.target.value)} />
              </Field>

              <Field label="自己紹介" name="selfIntroduction" hint="任意・2,000文字以内" error={errors.selfIntroduction} wide>
                <textarea id="selfIntroduction" value={values.selfIntroduction} onChange={(event) => update("selfIntroduction", event.target.value)} maxLength={2000} rows={6} />
              </Field>
            </div>

            <div className="actions">
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "更新中…" : "プロフィールを更新"}
              </button>
              <Link className="secondary-link" href="/students/me">キャンセル</Link>
            </div>
          </form>
        )}
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
