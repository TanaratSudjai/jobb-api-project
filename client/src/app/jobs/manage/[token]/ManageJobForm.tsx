"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteJson, putJson } from "@/lib/api";

type ManageJob = {
  jobId: number;
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: string;
  budgetMin: number | null;
  budgetMax: number | null;
  isApproved: boolean;
  isClosed: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

type Props = {
  token: string;
  job: ManageJob;
};

type StatusMessage =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

export function ManageJobForm({ token, job }: Props) {
  const [form, setForm] = useState({
    title: job.title,
    description: job.description,
    company: job.company,
    location: job.location,
    jobType: job.jobType,
    budgetMin: job.budgetMin ? job.budgetMin.toString() : "",
    budgetMax: job.budgetMax ? job.budgetMax.toString() : "",
    isClosed: job.isClosed,
  });
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
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
      isClosed: form.isClosed,
    };

    const result = await putJson<ManageJob>(
      `/api/jobs/manage/${token}`,
      payload,
    );

    if (!result.success) {
      setStatus({ type: "error", message: result.error });
      setIsSaving(false);
      return;
    }

    const updated = result.data;
    setForm((prev) => ({
      ...prev,
      title: updated.title,
      description: updated.description,
      company: updated.company,
      location: updated.location,
      jobType: updated.jobType,
      budgetMin: updated.budgetMin ? updated.budgetMin.toString() : "",
      budgetMax: updated.budgetMax ? updated.budgetMax.toString() : "",
      isClosed: updated.isClosed,
    }));
    setStatus({ type: "success", message: "อัปเดตประกาศเรียบร้อยแล้ว" });
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "ต้องการลบประกาศนี้หรือไม่? การลบไม่สามารถย้อนกลับได้.",
      )
    ) {
      return;
    }
    setIsDeleting(true);
    setStatus(null);

    const result = await deleteJson<{ message: string }>(
      `/api/jobs/manage/${token}`,
    );

    if (!result.success) {
      setStatus({ type: "error", message: result.error });
      setIsDeleting(false);
      return;
    }

    setStatus({
      type: "success",
      message: "ลบประกาศแล้ว คุณสามารถปิดหน้าต่างนี้ได้",
    });
    setIsDeleting(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm">
        <p>
          สถานะปัจจุบัน:{" "}
          <span className="font-medium">
            {job.isApproved ? "ผ่านการตรวจสอบ" : "รอตรวจสอบ"} •{" "}
            {form.isClosed ? "ปิดประกาศ" : "เปิดรับสมัคร"}
          </span>
        </p>
        <p className="text-xs text-foreground/60">
          หากต้องการให้ประกาศไม่แสดงต่อสาธารณะ ให้เปลี่ยนสถานะเป็น “ปิดประกาศ”
        </p>
      </div>

      {status ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            status.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {status.message}
        </div>
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
            <span className="font-medium text-foreground/80">บริษัท</span>
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
          <span className="font-medium text-foreground/80">รายละเอียด *</span>
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
            <span className="font-medium text-foreground/80">สถานที่</span>
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
            <span className="font-medium text-foreground/80">ประเภทงาน</span>
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
              งบประมาณขั้นต่ำ
            </span>
            <input
              type="number"
              min={0}
              value={form.budgetMin}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  budgetMin: event.target.value,
                }))
              }
              className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground/80">
              งบประมาณสูงสุด
            </span>
            <input
              type="number"
              min={0}
              value={form.budgetMax}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  budgetMax: event.target.value,
                }))
              }
              className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isClosed}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, isClosed: event.target.checked }))
            }
            className="h-4 w-4"
          />
          <span className="text-sm text-foreground/80">ปิดประกาศชั่วคราว</span>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "กำลังลบ..." : "ลบประกาศ"}
          </button>
        </div>
      </form>

      <div className="rounded-md border border-foreground/10 bg-foreground/5 px-4 py-3 text-xs text-foreground/60">
        <p>
          บันทึก: ในแต่ละครั้งที่คุณบันทึก ระบบจะขยายอายุลิงก์จัดการประกาศออกไปอีก
          30 วันโดยอัตโนมัติ
        </p>
        <p className="mt-1">
          หากต้องการความช่วยเหลือเพิ่มเติม โปรดติดต่อผู้ดูแลระบบผ่านอีเมลที่ได้รับเมื่อส่งประกาศ
        </p>
        <p className="mt-2">
          <Link
            href="/"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            กลับหน้ารวมประกาศ
          </Link>
        </p>
      </div>
    </div>
  );
}

