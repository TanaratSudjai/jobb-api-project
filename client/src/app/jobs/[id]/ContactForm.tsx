"use client";

import { FormEvent, useState } from "react";
import { postJson } from "@/lib/api";

type Props = {
  jobId: number;
};

type ContactResponse = {
  message?: string;
  jobContactId?: number;
};

type Status =
  | { type: "success" | "error"; message: string }
  | null;

export function ContactForm({ jobId }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<Status>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const payload = {
      ...form,
      phone: form.phone.trim() === "" ? undefined : form.phone,
      message: form.message.trim() === "" ? undefined : form.message,
    };

    const result = await postJson<ContactResponse>(
      `/api/jobs/${jobId}/contacts`,
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
        result.data.message ?? "ส่งข้อมูลการติดต่อสำเร็จ ทีมงานจะติดต่อกลับเร็วที่สุด",
    });

    setForm({
      name: "",
      email: "",
      phone: "",
      message: "",
    });

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4 rounded-lg border border-foreground/10 bg-white p-6 shadow-sm dark:bg-black">
      <h2 className="text-lg font-semibold">ส่งข้อมูลการติดต่อ</h2>
      <p className="text-sm text-foreground/70">
        ฝากข้อมูลการติดต่อไว้เพื่อให้บริษัทสามารถติดต่อกลับได้ง่ายขึ้น
      </p>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground/80">
            ชื่อของคุณ
          </label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground/80">
            อีเมลสำหรับติดต่อกลับ
          </label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground/80">
            เบอร์โทรศัพท์ (ถ้ามี)
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phone: event.target.value }))
            }
            className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground/80">
            ข้อความเพิ่มเติม
          </label>
          <textarea
            name="message"
            rows={4}
            value={form.message}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, message: event.target.value }))
            }
            className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "กำลังส่งข้อมูล..." : "ส่งข้อมูล"}
        </button>
      </form>
    </div>
  );
}

