"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { postJson } from "@/lib/api";

type RegisterResponse = {
  message?: string;
  userId?: number;
};

type Status =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState<Status>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const payload = {
      ...form,
      role: "normal" as const,
    };

    const result = await postJson<RegisterResponse>(
      "/api/auth/register",
      payload,
    );

    if (!result.success) {
      setStatus({
        type: "error",
        message: result.error,
      });
      setIsSubmitting(false);
      return;
    }

    const { data } = result;
    setStatus({
      type: "success",
      message: data.message ?? "สมัครสมาชิกสำเร็จ",
    });
    setForm((prev) => ({
      ...prev,
      password: "",
    }));

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-12">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">สมัครสมาชิกใหม่</h1>
          <p className="text-sm text-foreground/70">
            ข้อมูลจะถูกบันทึกในฐานข้อมูลเดียวกับ API (`workapp`)
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
              ชื่อที่ใช้แสดงผล
            </label>
            <input
              type="text"
              name="name"
              required
              autoComplete="name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

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
              autoComplete="new-password"
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
            {isSubmitting ? "กำลังสมัครสมาชิก..." : "สร้างบัญชี"}
          </button>
        </form>

        <p className="text-center text-sm text-foreground/70">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
