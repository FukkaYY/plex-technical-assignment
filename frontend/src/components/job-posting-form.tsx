"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  ApiRequestError,
  createCompanyJobPosting,
  JobPostingFields,
  updateCompanyJobPosting,
} from "@/lib/api";

const EMPTY_FIELDS: JobPostingFields = {
  title: "",
  role_name: "",
  work_location: "",
  description: "",
  requirements: "",
};

export default function JobPostingForm({ id, initialValues }: { id?: string; initialValues?: JobPostingFields }) {
  const router = useRouter();
  const [fields, setFields] = useState(initialValues ?? EMPTY_FIELDS);
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof JobPostingFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
  }

  function fieldError(field: keyof JobPostingFields) {
    return errors.find((error) => error.field === field)?.message;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setErrors([]);
    setIsSubmitting(true);

    try {
      if (id) await updateCompanyJobPosting(id, fields);
      else await createCompanyJobPosting(fields);
      router.push(`/companies/job-postings?saved=${id ? "updated" : "created"}`);
    } catch (error: unknown) {
      if (error instanceof ApiRequestError) {
        if (error.errors.some((item) => item.code === "unauthenticated")) {
          router.replace("/companies/login");
          return;
        }
        if (error.errors.some((item) => item.code === "forbidden")) {
          router.replace("/students/me");
          return;
        }
        setErrors(error.errors);
      } else {
        setErrors([{ field: "base", code: "unexpected", message: "募集の保存に失敗しました。" }]);
      }
      setIsSubmitting(false);
    }
  }

  const baseError = errors.find((error) => error.field === "base")?.message;

  return (
    <form className="form-grid single-column" onSubmit={submit}>
      {baseError && <div className="error-banner" role="alert">{baseError}</div>}
      <JobField label="タイトル" field="title" value={fields.title} maxLength={120} error={fieldError("title")} onChange={updateField} />
      <JobField label="募集職種" field="role_name" value={fields.role_name} maxLength={100} error={fieldError("role_name")} onChange={updateField} />
      <JobField label="勤務地・勤務形態" field="work_location" value={fields.work_location} maxLength={200} error={fieldError("work_location")} onChange={updateField} />
      <JobField label="募集内容" field="description" value={fields.description} maxLength={5000} rows={8} error={fieldError("description")} onChange={updateField} />
      <JobField label="応募条件" field="requirements" value={fields.requirements} maxLength={3000} rows={6} error={fieldError("requirements")} onChange={updateField} />
      <div className="actions">
        <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "保存中…" : id ? "募集を更新" : "募集を公開"}</button>
        <Link className="secondary-link" href="/companies/job-postings">キャンセル</Link>
      </div>
    </form>
  );
}

function JobField({ label, field, value, maxLength, rows, error, onChange }: {
  label: string;
  field: keyof JobPostingFields;
  value: string;
  maxLength: number;
  rows?: number;
  error?: string;
  onChange: (field: keyof JobPostingFields, value: string) => void;
}) {
  const id = `job-${field}`;
  return (
    <div className="field field-wide">
      <label htmlFor={id}>{label}<span className="required-label">必須</span></label>
      {rows ? (
        <textarea id={id} value={value} onChange={(event) => onChange(field, event.target.value)} maxLength={maxLength} rows={rows} aria-invalid={Boolean(error)} required />
      ) : (
        <input id={id} value={value} onChange={(event) => onChange(field, event.target.value)} maxLength={maxLength} aria-invalid={Boolean(error)} required />
      )}
      <span className="field-hint">{value.length} / {maxLength}文字</span>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
