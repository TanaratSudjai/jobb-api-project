"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readStoredUser } from "@/lib/auth-storage";

type ViewState =
  | { status: "loading" }
  | { status: "anonymous" }
  | {
      status: "authenticated";
      name: string;
      role: "admin" | "normal";
      email: string;
    };

const normalActions = [
  {
    title: "ดูประกาศงานทั้งหมด",
    description: "สำรวจงานที่เปิดรับและกรองตามความสนใจของคุณ",
    href: "/",
  },
  {
    title: "ย้อนกลับไปหน้ารายละเอียดงานที่สนใจ",
    description: "เข้าดูรายละเอียดและส่งข้อมูลติดต่อเพื่อให้บริษัทติดต่อกลับ",
    href: "/",
  },
];

const adminActions = [
  {
    title: "จัดการประกาศงาน",
    description: "ตรวจอนุมัติ ปิด หรือเปิดประกาศงาน พร้อมดูคำติดต่อ",
    href: "/admin/jobs",
  },
  {
    title: "ตรวจสอบรายงานประกาศ",
    description:
      "ดูประกาศที่ถูกแจ้งว่าไม่เหมาะสม และทำเครื่องหมายเมื่อจัดการแล้ว",
    href: "/admin/reports",
  },
  {
    title: "ย้อนกลับไปหน้าแรก",
    description: "ดูมุมมองแบบเดียวกับผู้ใช้ทั่วไปเพื่อทดสอบการแสดงผล",
    href: "/",
  },
];

export default function DashboardPage() {
  const [state, setState] = useState<ViewState>({ status: "loading" });
  const actions = useMemo(() => {
    if (state.status !== "authenticated") {
      return [];
    }
    return state.role === "admin" ? adminActions : normalActions;
  }, [state]);

  useEffect(() => {
    const stored = readStoredUser();
    if (!stored?.user) {
      setState({ status: "anonymous" });
      return;
    }

    const role =
      stored.user.role.toLowerCase() === "admin" ? "admin" : "normal";

    setState({
      status: "authenticated",
      name: stored.user.name,
      email: stored.user.email,
      role,
    });
  }, []);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-12">
          <p className="text-sm text-foreground/60">กำลังเตรียมแดชบอร์ด...</p>
        </div>
      </div>
    );
  }

  if (state.status === "anonymous") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
          <h1 className="text-3xl font-semibold">แดชบอร์ด</h1>
          <p className="text-sm text-foreground/70">
            กรุณาเข้าสู่ระบบเพื่อดูเมนูการทำงานของคุณ
          </p>
          <Link
            href="/auth/login"
            className="w-fit rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium hover:border-foreground/40"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-foreground/50">
            {state.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้งานทั่วไป"}
          </p>
          <h1 className="text-3xl font-semibold">สวัสดี {state.name}</h1>
          <p className="text-sm text-foreground/70">
            เข้าสู่ระบบด้วยอีเมล {state.email}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="rounded-lg border border-foreground/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-black"
            >
              <h2 className="text-lg font-semibold text-foreground">
                {action.title}
              </h2>
              <p className="mt-2 text-sm text-foreground/70">{action.description}</p>
            </Link>
          ))}
        </section>

        {state.role === "admin" ? (
          <section className="rounded-md border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground/70">
            <p>
              หากพบประกาศที่ต้องซ่อนหรือลบ กรุณาไปที่{" "}
              <Link
                href="/admin/jobs"
                className="underline-offset-2 hover:underline"
              >
                จัดการประกาศ
              </Link>{" "}
              และใช้คำสั่งปิดประกาศ รวมถึงตรวจสอบข้อมูลติดต่อจากผู้สมัคร
            </p>
          </section>
        ) : (
          <section className="rounded-md border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground/70">
            <p>
              หากพบประกาศผิดปกติ สามารถเข้าไปที่หน้ารายละเอียดประกาศแล้วกด
              “รายงานประกาศไม่เหมาะสม” เพื่อแจ้งให้ผู้ดูแลตรวจสอบได้ทันที
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

