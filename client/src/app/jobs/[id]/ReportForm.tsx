"use client";

import { FormEvent, useState } from "react";
import { postJson } from "@/lib/api";

type Props = {
  jobId: number;
};

type ReportResponse = {
  message?: string;
  jobReportId?: number;
};

type Status =
  | { type: "success" | "error"; message: string }
  | null;

export function ReportForm({ jobId }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    reason: "",
    description: "",
  });
  const [status, setStatus] = useState<Status>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const payload = {
      email: form.email,
      name: form.name.trim() === "" ? undefined : form.name,
      reason: form.reason,
      description: form.description.trim() === "" ? undefined : form.description,
    };

    const result = await postJson<ReportResponse>(
      `/api/jobs/${jobId}/reports`,
      payload,
    );

    if (!result.success) {
      setStatus({ type: "error", message: result.error });
      setIsSubmitting(false);
      return;
    }

    setStatus({
      type: "success",
      message:
        result.data.message ??
        "ส่งรายงานประกาศแล้ว ทีมงานจะตรวจสอบโดยเร็วที่สุด",
    });
    setForm({
      name: "",
      email: "",
      reason: "",
      description: "",
    });
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-900">
      <h2 className="text-lg font-semibold text-red-900">รายงานประกาศไม่เหมาะสม</h2>
      <p className="text-red-900/80">
        หากพบว่าประกาศนี้ผิดกฎหรือไม่เหมาะสม กรุณาแจ้งรายละเอียดเพื่อให้ทีมงานตรวจสอบ
      </p>

      {status ? (
        <p
          className={`rounded-md border px-4 py-3 text-sm ${status.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-300 bg-red-100 text-red-900"}`}
        >
          {status.message}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-red-900/80">
              ชื่อ (ถ้าต้องการ)
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-red-900">
              อีเมลสำหรับติดต่อกลับ *
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-red-900">
            สาเหตุที่ต้องการรายงาน *
          </label>
          <select
            name="reason"
            required
            value={form.reason}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, reason: event.target.value }))
            }
            className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <option value="" disabled>
              เลือกเหตุผล
            </option>
            <option value="ข้อมูลไม่ถูกต้อง">ข้อมูลไม่ถูกต้อง</option>
            <option value="เนื้อหาหลอกลวง">เนื้อหาหลอกลวง</option>
            <option value="มีเนื้อหาไม่เหมาะสม">มีเนื้อหาไม่เหมาะสม</option>
            <option value="อื่น ๆ">อื่น ๆ</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-red-900/80">
            รายละเอียดเพิ่มเติม
          </label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "กำลังส่งรายงาน..." : "ส่งรายงานประกาศ"}
        </button>
      </form>
    </div>
  );
}

