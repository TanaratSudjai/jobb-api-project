"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { readStoredUser, StoredUser } from "@/lib/auth-storage";

type Role = "admin" | "normal";

export default function AuthSuccessPage() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>("normal");
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const queryRole = searchParams.get("role");
    if (queryRole === "admin" || queryRole === "normal") {
      setRole(queryRole);
    }

    const stored = readStoredUser();
    if (stored?.user) {
      setUser(stored.user);
      const detectedRole =
        stored.user.role?.toLowerCase() === "admin" ? "admin" : "normal";
      setRole(detectedRole);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">เข้าสู่ระบบสำเร็จ</h1>
          <p className="text-sm text-foreground/70">
            ยินดีต้อนรับ{user ? ` ${user.name}` : ""} ({role === "admin" ? "Admin" : "Normal"})
          </p>
        </header>

        <section className="rounded-lg border border-foreground/10 bg-white p-6 shadow-sm dark:bg-black">
          {role === "admin" ? (
            <>
              <h2 className="text-lg font-semibold">สวัสดีผู้ดูแลระบบ</h2>
              <p className="mt-2 text-sm text-foreground/80">
                ตอนนี้คุณสามารถจัดการประกาศงานทั้งหมดได้ รวมถึงการอนุมัติ/ปฏิเสธและลบประกาศ
                อย่าลืมแนบ token ในคำขอ API ที่ต้องการสิทธิ์เพิ่มเติม
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-foreground/70">
                <li>
                  ใช้ header <code>X-User-Role: admin</code> หรือปรับ backend ให้ตรวจ JWT เพื่อยืนยันสิทธิ์
                </li>
                <li>
                  ทดลองเรียก <code>PUT /api/jobs/{'{id}'}/status</code> เพื่ออนุมัติประกาศงาน
                </li>
                <li>
                  ตรวจสอบรายงานประกาศที่ <Link href="/admin/reports" className="underline-offset-2 hover:underline">/admin/reports</Link> เมื่อมีผู้ใช้แจ้งเข้ามา
                </li>
              </ul>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold">ยินดีต้อนรับผู้ใช้งาน</h2>
              <p className="mt-2 text-sm text-foreground/80">
                คุณสามารถค้นหาประกาศงานที่อนุมัติแล้ว และสามารถเสนอแก้ไขรายละเอียดได้บางส่วน
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-foreground/70">
                <li>เริ่มต้นด้วยการสำรวจงานบนหน้าแรกของระบบ</li>
                <li>
                  หากต้องการสิทธิ์มากขึ้น ติดต่อผู้ดูแลเพื่อปรับบทบาทในฐานข้อมูล
                </li>
              </ul>
            </>
          )}
        </section>

        <section className="space-y-3 rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-5 text-sm text-foreground/80">
          <p>
            Token และข้อมูลผู้ใช้ถูกเก็บไว้ใน <code>localStorage</code> สามารถนำไปใช้กับ
            API อื่น ๆ ได้ทันที
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:opacity-90"
            >
              ไปยังแดชบอร์ด
            </Link>
            <Link
              href="/"
              className="rounded-md border border-foreground/20 px-3 py-2 text-sm font-medium hover:border-foreground/40"
            >
              กลับไปหน้าแรก
            </Link>
            <Link
              href="/auth/login"
              className="rounded-md border border-foreground/20 px-3 py-2 text-sm font-medium hover:border-foreground/40"
            >
              สลับบัญชีผู้ใช้
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
