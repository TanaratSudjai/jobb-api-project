"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/api";
import { saveAuth } from "@/lib/auth-storage";

type LoginResponse = {
  message?: string;
  token?: string;
  user?: {
    userId: number;
    name: string;
    email: string;
    role: string;
  };
};

type Status =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [status, setStatus] = useState<Status>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const result = await postJson<LoginResponse>("/api/auth/login", form);

    if (!result.success) {
      setStatus({
        type: "error",
        message: result.error,
      });
      setIsSubmitting(false);
      return;
    }

    const { data } = result;

    saveAuth(data.token, data.user);

    setStatus({
      type: "success",
      message: data.message ?? "เข้าสู่ระบบสำเร็จ กำลังพาไปหน้าถัดไป...",
    });

    setIsSubmitting(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-12">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">เข้าสู่ระบบ</h1>
          <p className="text-sm text-foreground/70">
            เข้าสู่ระบบเพื่อจัดการโปรไฟล์และติดตามประกาศงานที่คุณสนใจ
          </p>
        </header>

        {status ? (
          <p
            className={`rounded-md border px-4 py-3 text-sm ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {status.message}
          </p>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-foreground/10 bg-white p-6 shadow-sm dark:bg-black"
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/80">
              อีเมล
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/80">
              รหัสผ่าน
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-center text-sm text-foreground/70">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            สมัครสมาชิกใหม่
          </Link>
        </p>
        <p className="text-center text-xs text-foreground/60">
          ระบบจะบันทึกสถานะการใช้งานไว้ เพื่อให้คุณไม่ต้องเข้าสู่ระบบซ้ำระหว่างใช้งาน
        </p>
      </div>
    </div>
  );
}
