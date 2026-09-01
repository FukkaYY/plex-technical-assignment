export type ApiError = {
  field: string;
  code: string;
  message: string;
};

export type User = {
  id: number;
  email: string;
  role: "student" | "company";
};

export type StudentProfile = {
  id: number;
  user_id: number;
  name: string;
  school_name: string;
  graduation_year: number;
  desired_role: string;
  skills: string[];
  self_introduction: string;
};

export type CompanyProfile = {
  id: number;
  user_id: number;
  company_name: string;
};

export type AuthenticatedUserData = {
  user: User;
  student_profile: StudentProfile | null;
  company_profile: CompanyProfile | null;
};

export type StudentListItem = {
  id: number;
  name: string;
  school_name: string;
  graduation_year: number;
  desired_role: string;
  skills: string[];
  skills_count: number;
  self_introduction_excerpt: string;
  registered_at: string;
};

export type StudentListMeta = {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
};

export class ApiRequestError extends Error {
  constructor(public readonly errors: ApiError[]) {
    super(errors[0]?.message ?? "リクエストに失敗しました");
  }
}

async function csrfToken(): Promise<string> {
  const response = await fetch("/api/v1/csrf", {
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiRequestError([
      { field: "base", code: "csrf_unavailable", message: "送信の準備に失敗しました" },
    ]);
  }

  const body = (await response.json()) as { data: { csrf_token: string } };
  return body.data.csrf_token;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  const body = (await response.json().catch(() => null)) as { errors?: ApiError[] } | null;
  throw new ApiRequestError(
    body?.errors ?? [{ field: "base", code: "unexpected", message: "予期しないエラーが発生しました" }],
  );
}

export async function registerStudent(payload: Record<string, unknown>) {
  const token = await csrfToken();
  const response = await fetch("/api/v1/student_registrations", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({ student_registration: payload }),
  });

  return parseResponse<{ data: { user: User; student_profile: StudentProfile } }>(response);
}

export async function getCurrentUser() {
  const response = await fetch("/api/v1/me", {
    credentials: "same-origin",
    cache: "no-store",
  });

  return parseResponse<{ data: AuthenticatedUserData }>(response);
}

export async function login(email: string, password: string, role: User["role"]) {
  const token = await csrfToken();
  const response = await fetch("/api/v1/session", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({ session: { email, password, role } }),
  });

  return parseResponse<{ data: AuthenticatedUserData }>(response);
}

export async function getStudents(page = 1) {
  const response = await fetch(`/api/v1/students?page=${page}`, {
    credentials: "same-origin",
    cache: "no-store",
  });

  return parseResponse<{ data: StudentListItem[]; meta: StudentListMeta }>(response);
}

export async function logout() {
  const token = await csrfToken();
  const response = await fetch("/api/v1/session", {
    method: "DELETE",
    credentials: "same-origin",
    headers: { "X-CSRF-Token": token },
  });

  return parseResponse<void>(response);
}
