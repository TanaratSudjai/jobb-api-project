"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_BASE_URL, putJson } from "@/lib/api";
import { readStoredUser } from "@/lib/auth-storage";

type JobReport = {
  jobReportId: number;
  jobId: number;
  jobTitle: string;
  jobCompany: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  description?: string | null;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string | null;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; reports: JobReport[] };

export default function AdminReportsPage() {
  const stored = useMemo(() => readStoredUser(), []);
  const isAdmin =
    stored?.user?.role?.toLowerCase() === "admin" ||
    stored?.user?.role === "Admin";
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const controller = new AbortController();
    const fetchReports = async () => {
      setState({ status: "loading" });
      try {
        const response = await fetch(`${API_BASE_URL}/api/jobs/reports`, {
          headers: {
            "X-User-Role": "admin",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`โหลดข้อมูลไม่สำเร็จ (${response.status})`);
        }

        const data = (await response.json()) as JobReport[];
        setState({ status: "success", reports: data });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "ไม่สามารถโหลดรายงานประกาศได้";
        setState({ status: "error", message });
      }
    };

    fetchReports();

    return () => controller.abort();
  }, [isAdmin]);

  const handleResolve = async (report: JobReport, nextState: boolean) => {
    setIsUpdating(true);
    const result = await putJson<{ message: string }>(
      `/api/jobs/${report.jobId}/reports/${report.jobReportId}/resolve`,
      { isResolved: nextState },
      {
        headers: {
          "X-User-Role": "admin",
        },
      },
    );

    if (!result.success) {
      alert(result.error);
      setIsUpdating(false);
      return;
    }

    setState((prev) => {
      if (prev.status !== "success") {
        return prev;
      }

      return {
        status: "success",
        reports: prev.reports.map((item) =>
          item.jobReportId === report.jobReportId
            ? {
                ...item,
                isResolved: nextState,
                resolvedAt: nextState ? new Date().toISOString() : null,
              }
            : item,
        ),
      };
    });
    setIsUpdating(false);
  };

  if (!stored?.user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12 text-center">
          <h1 className="text-3xl font-semibold">ศูนย์รายงาน</h1>
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
            บัญชีนี้ยังไม่ใช่ผู้ดูแลระบบ หากต้องการดูรายงาน กรุณาติดต่อผู้ดูแล
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">รายงานประกาศไม่เหมาะสม</h1>
          <p className="text-sm text-foreground/70">
            ตรวจสอบรายงานจากผู้ใช้ และเปลี่ยนสถานะเมื่อดำเนินการเสร็จแล้ว
          </p>
        </header>

        {state.status === "loading" ? (
          <p className="text-sm text-foreground/60">กำลังโหลดรายงาน...</p>
        ) : null}

        {state.status === "error" ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {state.message}
          </p>
        ) : null}

        {state.status === "success" ? (
          state.reports.length === 0 ? (
            <p className="rounded-md border border-dashed border-foreground/20 px-4 py-6 text-sm text-foreground/70">
              ยังไม่มีรายงานประกาศเข้ามา
            </p>
          ) : (
            <div className="space-y-4">
              {state.reports.map((report) => (
                <article
                  key={report.jobReportId}
                  className="rounded-lg border border-foreground/10 bg-white p-6 shadow-sm dark:bg-black"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        {report.reason}
                      </h2>
                      <p className="text-sm text-foreground/70">
                        รายงานเมื่อ{" "}
                        {new Date(report.createdAt).toLocaleString("th-TH")}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${report.isResolved ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}
                    >
                      {report.isResolved ? "ดำเนินการแล้ว" : "รอดำเนินการ"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-foreground/80">
                    <p>
                      <span className="font-medium">ประกาศ:</span>{" "}
                      <Link
                        href={`/jobs/${report.jobId}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {report.jobTitle} ({report.jobCompany})
                      </Link>
                    </p>
                    <p>
                      <span className="font-medium">ผู้รายงาน:</span>{" "}
                      {report.reporterName
                        ? `${report.reporterName} • ${report.reporterEmail}`
                        : report.reporterEmail}
                    </p>
                    {report.description ? (
                      <p className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-2 text-foreground/70">
                        {report.description}
                      </p>
                    ) : null}
                    {report.isResolved && report.resolvedAt ? (
                      <p className="text-xs text-foreground/60">
                        ปิดรายงานเมื่อ{" "}
                        {new Date(report.resolvedAt).toLocaleString("th-TH")}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/admin/jobs/${report.jobId}/contacts`}
                      className="rounded-md border border-foreground/20 px-3 py-2 text-sm font-medium hover:border-foreground/40"
                    >
                      ดูการติดต่อของประกาศนี้
                    </Link>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        handleResolve(report, report.isResolved ? false : true)
                      }
                      className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {report.isResolved ? "เปิดรายงานอีกครั้ง" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

