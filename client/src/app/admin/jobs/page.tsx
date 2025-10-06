"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_BASE_URL, putJson } from "@/lib/api";
import { readStoredUser } from "@/lib/auth-storage";

type Job = {
  jobId: number;
  title: string;
  description: string;
  company: string;
  location: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; jobs: Job[] };

export default function AdminJobsPage() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });
  const [isActing, setIsActing] = useState(false);
  const stored = useMemo(() => readStoredUser(), []);

  const isAdmin =
    stored?.user?.role?.toLowerCase() === "admin" ||
    stored?.user?.role === "Admin";

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const controller = new AbortController();
    const fetchJobs = async () => {
      setLoadState({ status: "loading" });
      try {
        const response = await fetch(`${API_BASE_URL}/api/jobs`, {
          headers: {
            "X-User-Role": "admin",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`โหลดข้อมูลไม่สำเร็จ (${response.status})`);
        }

        const data = (await response.json()) as Job[];
        setLoadState({ status: "success", jobs: data });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดขณะโหลดข้อมูล";
        setLoadState({ status: "error", message });
      }
    };

    fetchJobs();

    return () => controller.abort();
  }, [isAdmin]);

  const handleToggleApproval = async (job: Job) => {
    setIsActing(true);
    const result = await putJson<{ message: string }>(
      `/api/jobs/${job.jobId}/status`,
      { isApproved: !job.isApproved },
      {
        headers: {
          "X-User-Role": "admin",
        },
      },
    );
    if (!result.success) {
      alert(result.error);
      setIsActing(false);
      return;
    }

    setLoadState((prev) => {
      if (prev.status !== "success") {
        return prev;
      }

      return {
        status: "success",
        jobs: prev.jobs.map((item) =>
          item.jobId === job.jobId
            ? { ...item, isApproved: !job.isApproved, updatedAt: new Date().toISOString() }
            : item,
        ),
      };
    });

    setIsActing(false);
  };

  if (!stored?.user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12 text-center">
          <h1 className="text-3xl font-semibold">พื้นที่จัดการประกาศงาน</h1>
          <p className="text-sm text-foreground/70">
            กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลก่อนใช้งาน
          </p>
          <Link
            href="/auth/login"
            className="mx-auto rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium hover:border-foreground/40"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12 text-center">
          <h1 className="text-3xl font-semibold">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-sm text-foreground/70">
            บัญชีของคุณยังไม่ใช่ผู้ดูแลระบบ หากต้องการจัดการประกาศงาน กรุณาติดต่อผู้ดูแล
          </p>
          <Link
            href="/"
            className="mx-auto rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium hover:border-foreground/40"
          >
            กลับไปหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  const jobs =
    loadState.status === "success" ? loadState.jobs : ([] as Job[]);

  const pendingJobs = jobs.filter((job) => !job.isApproved);
  const approvedJobs = jobs.filter((job) => job.isApproved);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">จัดการประกาศงาน</h1>
          <p className="text-sm text-foreground/70">
            สลับสถานะการอนุมัติ เพื่อให้ประกาศแสดงผลในหน้าผู้ใช้งานทั่วไป
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/admin/reports"
              className="rounded-md border border-foreground/20 px-3 py-2 font-medium hover:border-foreground/40"
            >
              ดูรายงานประกาศไม่เหมาะสม
            </Link>
          </div>
        </header>

        {loadState.status === "loading" ? (
          <p className="text-sm text-foreground/60">กำลังโหลดข้อมูล...</p>
        ) : null}

        {loadState.status === "error" ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {loadState.message}
          </p>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">ประกาศที่รออนุมัติ</h2>
          {pendingJobs.length === 0 ? (
            <p className="rounded-md border border-dashed border-foreground/20 px-4 py-6 text-sm text-foreground/70">
              ไม่มีประกาศที่รออนุมัติ
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingJobs.map((job) => (
                <article
                  key={job.jobId}
                  className="flex flex-col gap-4 rounded-lg border border-foreground/10 bg-white p-6 shadow-sm dark:bg-black"
                >
                  <div>
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <p className="text-sm text-foreground/70">
                      {job.company} • {job.location}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-foreground/70">
                    <span>
                      สร้างเมื่อ{" "}
                      {new Date(job.createdAt).toLocaleString("th-TH")}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/jobs/${job.jobId}/contacts`}
                        className="rounded-md border border-foreground/20 px-3 py-2 text-sm font-medium hover:border-foreground/40"
                      >
                        ดูข้อมูลติดต่อ
                      </Link>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleToggleApproval(job)}
                        className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        อนุมัติประกาศ
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">ประกาศที่อนุมัติแล้ว</h2>
          {approvedJobs.length === 0 ? (
            <p className="rounded-md border border-dashed border-foreground/20 px-4 py-6 text-sm text-foreground/70">
              ยังไม่มีประกาศที่เปิดเผยต่อสาธารณะ
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approvedJobs.map((job) => (
                <article
                  key={job.jobId}
                  className="flex flex-col gap-4 rounded-lg border border-foreground/10 bg-white p-6 shadow-sm dark:bg-black"
                >
                  <div>
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <p className="text-sm text-foreground/70">
                      {job.company} • {job.location}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-foreground/70">
                    <span>
                      อัปเดตล่าสุด{" "}
                      {new Date(job.updatedAt ?? job.createdAt).toLocaleString(
                        "th-TH",
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${job.jobId}`}
                        className="rounded-md border border-foreground/20 px-3 py-2 text-sm font-medium hover:border-foreground/40"
                      >
                        ดูหน้าประกาศ
                      </Link>
                      <Link
                        href={`/admin/jobs/${job.jobId}/contacts`}
                        className="rounded-md border border-foreground/20 px-3 py-2 text-sm font-medium hover:border-foreground/40"
                      >
                        ข้อมูลติดต่อ
                      </Link>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleToggleApproval(job)}
                        className="rounded-md border border-foreground/20 px-3 py-2 text-sm font-medium hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        ปิดประกาศ
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
