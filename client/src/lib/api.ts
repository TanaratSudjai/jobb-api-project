const DEFAULT_API_BASE_URL = "http://localhost:5000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

type ApiErrorPayload = {
  message?: string;
};

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type JsonRequestOptions = {
  headers?: HeadersInit;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
};

async function requestJson<T>(
  path: string,
  body: unknown,
  options: JsonRequestOptions,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const errorPayload = (payload ?? {}) as ApiErrorPayload;
      const message =
        typeof errorPayload.message === "string" && errorPayload.message.trim()
          ? errorPayload.message
          : `คำขอไม่สำเร็จ (status ${response.status})`;

      return { success: false, error: message };
    }

    return { success: true, data: payload as T };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
    return { success: false, error: message };
  }
}

export function postJson<T>(
  path: string,
  body: unknown,
  options: Omit<JsonRequestOptions, "method"> = {},
) {
  return requestJson<T>(path, body, { ...options, method: "POST" });
}

export function putJson<T>(
  path: string,
  body: unknown,
  options: Omit<JsonRequestOptions, "method"> = {},
) {
  return requestJson<T>(path, body, { ...options, method: "PUT" });
}
