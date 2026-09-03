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
  visible_to_companies: boolean;
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

export type StudentSearchFilters = {
  query?: string;
  graduationYear?: string;
  desiredRole?: string;
};

export type StudentDetail = {
  id: number;
  name: string;
  school_name: string;
  graduation_year: number;
  desired_role: string;
  skills: string[];
  self_introduction: string;
};

export type MessageItem = {
  id: number;
  body: string;
  sent_at: string;
  sender_role: "student" | "company";
};

export type ScheduleProposal = {
  id: number;
  starts_at: string;
  ends_at: string;
  location: string;
  note: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
};

export type StudentMessageHistory = {
  student: Pick<StudentDetail, "id" | "name">;
  conversation_id: number | null;
  messages: MessageItem[];
  schedule_proposals: ScheduleProposal[];
};

export type ConversationCompany = {
  company_name: string;
};

export type ConversationListItem = {
  id: number;
  company: ConversationCompany;
  latest_message_excerpt: string;
  latest_message_sent_at: string;
  unread_count: number;
};

export type ConversationDetail = {
  id: number;
  company: ConversationCompany;
  messages: MessageItem[];
  schedule_proposals: ScheduleProposal[];
};

export type JobPostingFields = {
  title: string;
  role_name: string;
  work_location: string;
  description: string;
  requirements: string;
};

export type CompanyJobPosting = JobPostingFields & {
  id: number;
  status: "published" | "closed";
  created_at: string;
  updated_at: string;
};

export type StudentJobPosting = JobPostingFields & {
  id: number;
  company: ConversationCompany;
  created_at: string;
};

export type GroupMessageItem = MessageItem & {
  sender_name: string;
};

export type GroupListItem = {
  id: number;
  name: string;
  company?: ConversationCompany;
  student_count: number;
  latest_message_excerpt: string | null;
  latest_message_sent_at: string | null;
};

export type GroupConversationDetail = {
  id: number;
  name: string;
  company?: ConversationCompany;
  students: Array<{ id: number; name: string }>;
  messages: GroupMessageItem[];
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

export async function updateStudentProfile(payload: Record<string, unknown>) {
  const token = await csrfToken();
  const response = await fetch("/api/v1/student_profile", {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({ student_profile: payload }),
  });

  return parseResponse<{ data: StudentProfile }>(response);
}

export async function updateStudentProfileVisibility(visibleToCompanies: boolean) {
  const token = await csrfToken();
  const response = await fetch("/api/v1/student_profile/visibility", {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({ student_profile: { visible_to_companies: visibleToCompanies } }),
  });

  return parseResponse<{ data: StudentProfile }>(response);
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

export async function getStudents(page = 1, filters: StudentSearchFilters = {}) {
  const params = new URLSearchParams({ page: String(page) });
  if (filters.query) params.set("query", filters.query);
  if (filters.graduationYear) params.set("graduation_year", filters.graduationYear);
  if (filters.desiredRole) params.set("desired_role", filters.desiredRole);

  const response = await fetch(`/api/v1/students?${params.toString()}`, {
    credentials: "same-origin",
    cache: "no-store",
  });

  return parseResponse<{ data: StudentListItem[]; meta: StudentListMeta }>(response);
}

export async function getStudent(id: string) {
  const response = await fetch(`/api/v1/students/${encodeURIComponent(id)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });

  return parseResponse<{ data: StudentDetail }>(response);
}

export async function getStudentMessages(studentId: string) {
  const response = await fetch(`/api/v1/students/${encodeURIComponent(studentId)}/messages`, {
    credentials: "same-origin",
    cache: "no-store",
  });

  return parseResponse<{ data: StudentMessageHistory }>(response);
}

export async function sendStudentMessage(studentId: string, body: string) {
  const token = await csrfToken();
  const response = await fetch(`/api/v1/students/${encodeURIComponent(studentId)}/messages`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({ message: { body } }),
  });

  return parseResponse<{ data: { conversation_id: number; message: MessageItem } }>(response);
}

export async function createScheduleProposal(studentId: string, payload: {
  starts_at: string;
  ends_at: string;
  location: string;
  note: string;
}) {
  const token = await csrfToken();
  const response = await fetch(`/api/v1/students/${encodeURIComponent(studentId)}/schedule_proposals`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
    body: JSON.stringify({ schedule_proposal: payload }),
  });
  return parseResponse<{ data: ScheduleProposal }>(response);
}

export async function cancelScheduleProposal(id: number) {
  return updateScheduleProposalStatus(`/api/v1/company/schedule_proposals/${id}/cancel`);
}

export async function acceptScheduleProposal(id: number) {
  return updateScheduleProposalStatus(`/api/v1/schedule_proposals/${id}/accept`);
}

export async function declineScheduleProposal(id: number) {
  return updateScheduleProposalStatus(`/api/v1/schedule_proposals/${id}/decline`);
}

async function updateScheduleProposalStatus(path: string) {
  const token = await csrfToken();
  const response = await fetch(path, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "X-CSRF-Token": token },
  });
  return parseResponse<{ data: ScheduleProposal }>(response);
}

export async function getConversations() {
  const response = await fetch("/api/v1/conversations", {
    credentials: "same-origin",
    cache: "no-store",
  });

  return parseResponse<{ data: ConversationListItem[] }>(response);
}

export async function getConversation(id: string) {
  const response = await fetch(`/api/v1/conversations/${encodeURIComponent(id)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });

  return parseResponse<{ data: ConversationDetail }>(response);
}

export async function markConversationRead(id: string, messageId: number) {
  const token = await csrfToken();
  const response = await fetch(`/api/v1/conversations/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({ conversation: { message_id: messageId } }),
  });

  return parseResponse<{ data: { unread_count: number } }>(response);
}

export async function replyToConversation(id: string, body: string) {
  const token = await csrfToken();
  const response = await fetch(`/api/v1/conversations/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({ message: { body } }),
  });

  return parseResponse<{ data: { message: MessageItem } }>(response);
}

export async function getCompanyJobPostings() {
  const response = await fetch("/api/v1/company/job_postings", {
    credentials: "same-origin",
    cache: "no-store",
  });
  return parseResponse<{ data: CompanyJobPosting[] }>(response);
}

export async function getCompanyJobPosting(id: string) {
  const response = await fetch(`/api/v1/company/job_postings/${encodeURIComponent(id)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  return parseResponse<{ data: CompanyJobPosting }>(response);
}

export async function createCompanyJobPosting(payload: JobPostingFields) {
  const token = await csrfToken();
  const response = await fetch("/api/v1/company/job_postings", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
    body: JSON.stringify({ job_posting: payload }),
  });
  return parseResponse<{ data: CompanyJobPosting }>(response);
}

export async function updateCompanyJobPosting(id: string, payload: JobPostingFields) {
  const token = await csrfToken();
  const response = await fetch(`/api/v1/company/job_postings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
    body: JSON.stringify({ job_posting: payload }),
  });
  return parseResponse<{ data: CompanyJobPosting }>(response);
}

export async function closeCompanyJobPosting(id: number) {
  const token = await csrfToken();
  const response = await fetch(`/api/v1/company/job_postings/${id}/close`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "X-CSRF-Token": token },
  });
  return parseResponse<{ data: CompanyJobPosting }>(response);
}

export async function getStudentJobPostings() {
  const response = await fetch("/api/v1/job_postings", {
    credentials: "same-origin",
    cache: "no-store",
  });
  return parseResponse<{ data: StudentJobPosting[] }>(response);
}

export async function getStudentJobPosting(id: string) {
  const response = await fetch(`/api/v1/job_postings/${encodeURIComponent(id)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  return parseResponse<{ data: StudentJobPosting }>(response);
}

export async function getAllStudents() {
  const first = await getStudents(1);
  const pages = Array.from({ length: Math.max(first.meta.total_pages - 1, 0) }, (_, index) => index + 2);
  const rest = await Promise.all(pages.map((page) => getStudents(page)));
  return [first.data, ...rest.map((response) => response.data)].flat();
}

export async function getCompanyGroups() {
  const response = await fetch("/api/v1/company/group_conversations", { credentials: "same-origin", cache: "no-store" });
  return parseResponse<{ data: GroupListItem[] }>(response);
}

export async function getCompanyGroup(id: string) {
  const response = await fetch(`/api/v1/company/group_conversations/${encodeURIComponent(id)}`, { credentials: "same-origin", cache: "no-store" });
  return parseResponse<{ data: GroupConversationDetail }>(response);
}

export async function createCompanyGroup(payload: { name: string; student_ids: number[]; body: string }) {
  const token = await csrfToken();
  const response = await fetch("/api/v1/company/group_conversations", {
    method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": token }, body: JSON.stringify({ group_conversation: payload }),
  });
  return parseResponse<{ data: GroupConversationDetail }>(response);
}

export async function sendCompanyGroupMessage(id: string, body: string) {
  return sendGroupMessage(`/api/v1/company/group_conversations/${encodeURIComponent(id)}/messages`, body);
}

export async function getStudentGroups() {
  const response = await fetch("/api/v1/group_conversations", { credentials: "same-origin", cache: "no-store" });
  return parseResponse<{ data: GroupListItem[] }>(response);
}

export async function getStudentGroup(id: string) {
  const response = await fetch(`/api/v1/group_conversations/${encodeURIComponent(id)}`, { credentials: "same-origin", cache: "no-store" });
  return parseResponse<{ data: GroupConversationDetail }>(response);
}

export async function sendStudentGroupMessage(id: string, body: string) {
  return sendGroupMessage(`/api/v1/group_conversations/${encodeURIComponent(id)}/messages`, body);
}

async function sendGroupMessage(path: string, body: string) {
  const token = await csrfToken();
  const response = await fetch(path, {
    method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": token }, body: JSON.stringify({ message: { body } }),
  });
  return parseResponse<{ data: GroupMessageItem }>(response);
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
