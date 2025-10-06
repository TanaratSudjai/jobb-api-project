"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { postJson } from "@/lib/api";

type PostJobResponse = {
  message: string;
  jobId: number;
  manageToken: string;
  manageTokenExpiresAt: string;
};

type Status =
  | { type: "success"; data: PostJobResponse }
  | { type: "error"; message: string }
  | null;

export default function PostJobPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    company: "",
    location: "",
    jobType: "",
    budgetMin: "",
    budgetMax: "",
    posterName: "",
    posterEmail: "",
    acceptTerms: false,
  });

  const [status, setStatus] = useState<Status>(null);
  const [manageUrl, setManageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.acceptTerms) {
      setStatus({
        type: "error",
        message: "กรุณายอมรับเงื่อนไขการใช้งานก่อนส่งประกาศ",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const payload = {
      title: form.title,
      description: form.description,
      company: form.company.trim() === "" ? undefined : form.company,
      location: form.location.trim() === "" ? undefined : form.location,
      jobType: form.jobType.trim() === "" ? undefined : form.jobType,
      budgetMin:
        form.budgetMin.trim() === "" ? undefined : Number(form.budgetMin),
      budgetMax:
        form.budgetMax.trim() === "" ? undefined : Number(form.budgetMax),
      posterName: form.posterName.trim() === "" ? undefined : form.posterName,
      posterEmail: form.posterEmail,
      acceptTerms: form.acceptTerms,
    };

    const result = await postJson<PostJobResponse>(
      "/api/jobs/public",
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

    setStatus({
      type: "success",
      data: {
        ...result.data,
        manageTokenExpiresAt: result.data.manageTokenExpiresAt,
      },
    });
    setIsSubmitting(false);
    setForm({
      title: "",
      description: "",
      company: "",
      location: "",
      jobType: "",
      budgetMin: "",
      budgetMax: "",
      posterName: "",
      posterEmail: "",
      acceptTerms: false,
    });
  };

  const manageLink = useMemo(() => {
    if (status?.type !== "success") {
      return null;
    }
    return `/jobs/manage/${status.data.manageToken}`;
  }, [status]);

  useEffect(() => {
    if (manageLink) {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      setManageUrl(`${origin}${manageLink}`);
    } else {
      setManageUrl(null);
    }
  }, [manageLink]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">โพสต์งานใหม่</h1>
          <p className="text-sm text-foreground/70">
            กรอกข้อมูลรายละเอียดงานให้ครบถ้วน ทีมงานจะตรวจสอบและเผยแพร่หลังจากผ่านการอนุมัติ
          </p>
        </header>

        {status ? (
          status.type === "success" ? (
            <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
              <p className="font-medium">{status.data.message}</p>
              <p>
                เก็บลิงก์สำหรับจัดการประกาศไว้ให้ดี คุณสามารถแก้ไข ปิด หรือ ลบประกาศได้ผ่านลิงก์นี้
              </p>
              {manageUrl ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs break-all text-emerald-900">
                    {manageUrl}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (manageUrl) {
                        navigator.clipboard
                          ?.writeText(manageUrl)
                          .then(() =>
                            setStatus((prev) =>
                              prev && prev.type === "success"
                                ? {
                                    ...prev,
                                    message:
                                      "คัดลอกลิงก์จัดการประกาศไปยังคลิปบอร์ดแล้ว",
                                  }
                                : prev,
                            ),
                          )
                          .catch(() =>
                            setStatus((prev) =>
                              prev && prev.type === "success"
                                ? {
                                    ...prev,
                                    message:
                                      "ไม่สามารถคัดลอกอัตโนมัติได้ กรุณาคัดลอกด้วยตัวเอง",
                                  }
                                : prev,
                            ),
                          );
                      }
                    }}
                    className="rounded-md border border-emerald-400 px-3 py-1 text-xs font-medium text-emerald-800 hover:border-emerald-500"
                  >
                    คัดลอกลิงก์
                  </button>
                </div>
              ) : null}
              {manageLink ? (
                <div>
                  <Link
                    href={manageLink}
                    className="inline-flex items-center gap-2 rounded-md border border-emerald-400 px-3 py-2 text-xs font-medium hover:border-emerald-500"
                  >
                    เปิดหน้าจัดการประกาศ
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {status.message}
            </div>
          )
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-foreground/10 bg-white p-6 shadow-sm dark:bg-black"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground/80">ชื่องาน *</span>
              <input
                type="text"
                required
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground/80">บริษัท/หน่วยงาน</span>
              <input
                type="text"
                value={form.company}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, company: event.target.value }))
                }
                className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground/80">
              รายละเอียดงาน *
            </span>
            <textarea
              required
              rows={6}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground/80">สถานที่ทำงาน</span>
              <input
                type="text"
                value={form.location}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, location: event.target.value }))
                }
                className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground/80">
                ประเภทงาน (เช่น Full-time, Freelance)
              </span>
              <input
                type="text"
                value={form.jobType}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, jobType: event.target.value }))
                }
                className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground/80">
                งบประมาณขั้นต่ำ (บาท/เดือน)
              </span>
              <input
                type="number"
                min={0}
                value={form.budgetMin}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, budgetMin: event.target.value }))
                }
                className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground/80">
                งบประมาณสูงสุด (บาท/เดือน)
              </span>
              <input
                type="number"
                min={0}
                value={form.budgetMax}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, budgetMax: event.target.value }))
                }
                className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground/80">
                ชื่อผู้รับผิดชอบ
              </span>
              <input
                type="text"
                value={form.posterName}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    posterName: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground/80">
                อีเมลสำหรับติดต่อกลับ *
              </span>
              <input
                type="email"
                required
                value={form.posterEmail}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    posterEmail: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </label>
          </div>

          <label className="flex items-start gap-3 text-xs text-foreground/70">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.acceptTerms}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, acceptTerms: event.target.checked }))
              }
            />
            <span>
              ฉันยืนยันว่าข้อมูลประกาศงานเป็นความจริงและยอมรับการตรวจสอบโดยผู้ดูแลระบบ หากพบว่าผิดกฎ
              ประกาศอาจถูกปิดหรือถอดออก
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "กำลังส่งประกาศ..." : "ส่งประกาศงาน"}
            </button>
            <Link
              href="/"
              className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium hover:border-foreground/40"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
