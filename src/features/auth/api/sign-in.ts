import type {
  AuthProfile,
  SignInPayload,
  SignInResponse,
} from "@/features/auth/types/auth";

const DEFAULT_AUTH_API_BASE_URL = "http://localhost:8081";

const AUTH_API_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? DEFAULT_AUTH_API_BASE_URL;

function extractErrorMessage(data: unknown): string {
  if (typeof data === "object" && data !== null && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin tài khoản.";
}

function isSignInResponse(data: unknown): data is SignInResponse {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const accessToken = (data as { accessToken?: unknown }).accessToken;
  return typeof accessToken === "string" && accessToken.trim().length > 0;
}

function extractRole(profile: AuthProfile | null): string | null {
  if (!profile || typeof profile.role !== "string") {
    return null;
  }

  return profile.role.trim().toLowerCase();
}

async function getProfile(accessToken: string): Promise<AuthProfile | null> {
  const response = await fetch(`${AUTH_API_BASE_URL}/auth/profile`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }

  if (typeof data !== "object" || data === null) {
    return null;
  }

  return data as AuthProfile;
}

export async function signIn(payload: SignInPayload): Promise<SignInResponse> {
  const response = await fetch(`${AUTH_API_BASE_URL}/auth/sign_in`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }

  if (!isSignInResponse(data)) {
    throw new Error("Phản hồi đăng nhập không hợp lệ từ máy chủ.");
  }

  const profile = await getProfile(data.accessToken);
  const role = extractRole(profile);

  if (role !== "admin") {
    throw new Error("Tài khoản không có quyền quản trị để đăng nhập.");
  }

  return data as SignInResponse;
}
