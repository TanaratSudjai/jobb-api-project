"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { readStoredUser } from "@/lib/auth-storage";

type JobContact = {
  jobContactId: number;
  jobId: number;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  createdAt: string;
};

type Job = {
  jobId: number;
  title: string;
  company: string;
  location: string;
};

type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

export default function JobContactsPage() {
  const params = useParams<{ id: string }>();
  const jobId = Number(params?.id);
  const stored = useMemo(() => readStoredUser(), []);
  const isAdmin =
    stored?.user?.role?.toLowerCase() === "admin" ||
    stored?.user?.role === "Admin";

  const [jobState, setJobState] = useState<LoadState<Job>>({
    status: "loading",
  });
  const [contactsState, setContactsState] = useState<LoadState<JobContact[]>>({
    status: "loading",
  });

  useEffect(() => {
    if (!isAdmin || Number.isNaN(jobId)) {
      return;
    }

    const controller = new AbortController();

    const fetchJob = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
          headers: {
            "X-User-Role": "admin",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 404) {
          throw new Error("ไม่พบประกาศงาน");
        }

        if (!response.ok) {
          throw new Error(`โหลดข้อมูลไม่สำเร็จ (${response.status})`);
        }

        const data = (await response.json()) as Job;
        setJobState({ status: "success", data });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "ไม่สามารถโหลดรายละเอียดงานได้";
        setJobState({ status: "error", message });
      }
    };

    const fetchContacts = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/jobs/${jobId}/contacts`,
          {
            headers: {
              "X-User-Role": "admin",
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (response.status === 404) {
          throw new Error("ไม่พบประกาศงาน");
        }

        if (!response.ok) {
          throw new Error(`โหลดข้อมูลไม่สำเร็จ (${response.status})`);
        }

        const data = (await response.json()) as JobContact[];
        setContactsState({ status: "success", data });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "ไม่สามารถโหลดข้อมูลการติดต่อได้";
        setContactsState({ status: "error", message });
      }
    };

    fetchJob();
    fetchContacts();

    return () => controller.abort();
  }, [isAdmin, jobId]);

  if (!stored?.user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12 text-center">
          <h1 className="text-3xl font-semibold">พื้นที่ผู้ดูแลระบบ</h1>
          <p className="text-sm text-foreground/70">
            กรุณาเข้าสู่ระบบก่อนเข้าถึงข้อมูลนี้
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
            บัญชีนี้ยังไม่ใช่ผู้ดูแลระบบ หากต้องการเข้าถึงข้อมูลการติดต่อ โปรดติดต่อผู้ดูแล
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

  const jobTitle =
    jobState.status === "success"
      ? `${jobState.data.title} (${jobState.data.company} • ${jobState.data.location})`
      : `ประกาศงาน #${jobId}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <Link
            href="/admin/jobs"
            className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground"
          >
            ← กลับไปจัดการประกาศงาน
          </Link>
          <h1 className="text-3xl font-semibold">ข้อมูลการติดต่อ</h1>
          <p className="text-sm text-foreground/70">{jobTitle}</p>
        </header>

        {jobState.status === "error" ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {jobState.message}
          </p>
        ) : null}

        {contactsState.status === "loading" ? (
          <p className="text-sm text-foreground/60">กำลังโหลดข้อมูล...</p>
        ) : null}

        {contactsState.status === "error" ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {contactsState.message}
          </p>
        ) : null}

        {contactsState.status === "success" ? (
          contactsState.data.length === 0 ? (
            <p className="rounded-md border border-dashed border-foreground/20 px-4 py-6 text-sm text-foreground/70">
              ยังไม่มีผู้สนใจฝากข้อมูลการติดต่อสำหรับประกาศนี้
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-foreground/10 bg-white shadow-sm dark:bg-black">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-foreground/10 bg-foreground/5 text-xs uppercase text-foreground/60">
                  <tr>
                    <th className="px-4 py-3">ชื่อ</th>
                    <th className="px-4 py-3">อีเมล</th>
                    <th className="px-4 py-3">เบอร์โทร</th>
                    <th className="px-4 py-3">ข้อความ</th>
                    <th className="px-4 py-3">ส่งเมื่อ</th>
                  </tr>
                </thead>
                <tbody>
                  {contactsState.data.map((contact) => (
                    <tr
                      key={contact.jobContactId}
                      className="border-b border-foreground/10 last:border-b-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {contact.name}
                      </td>
                      <td className="px-4 py-3">{contact.email}</td>
                      <td className="px-4 py-3">{contact.phone ?? "-"}</td>
                      <td className="px-4 py-3 text-foreground/70">
                        {contact.message ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-foreground/60">
                        {new Date(contact.createdAt).toLocaleString("th-TH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

