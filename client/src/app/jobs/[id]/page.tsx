import { notFound } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { ContactForm } from "./ContactForm";
import { ReportForm } from "./ReportForm";

type Job = {
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

async function fetchJob(id: string): Promise<Job | null> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`โหลดประกาศงานไม่สำเร็จ (${response.status})`);
  }

  return (await response.json()) as Job;
}

type Props = {
  params: { id: string };
};

export default async function JobDetailPage({ params }: Props) {
  const { id } = params;
  const job = await fetchJob(id);

  if (!job || !job.isApproved || job.isClosed) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground"
          >
            ← กลับไปหน้ารวมประกาศงาน
          </Link>
          <h1 className="text-3xl font-semibold">{job.title}</h1>
          <p className="text-sm text-foreground/70">
            {job.company} • {job.location}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
            {job.jobType ? (
              <span className="rounded-full border border-foreground/15 px-2 py-1">
                {job.jobType}
              </span>
            ) : null}
            {job.budgetMin || job.budgetMax ? (
              <span>
                งบประมาณ{" "}
                {job.budgetMin
                  ? job.budgetMax && job.budgetMax !== job.budgetMin
                    ? `${job.budgetMin.toLocaleString("th-TH")} - ${job.budgetMax?.toLocaleString("th-TH")} บาท/เดือน`
                    : `${job.budgetMin.toLocaleString("th-TH")} บาท/เดือน`
                  : job.budgetMax
                    ? `สูงสุด ${job.budgetMax.toLocaleString("th-TH")} บาท/เดือน`
                    : ""}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-foreground/60">
            อัปเดตล่าสุด{" "}
            {new Date(job.updatedAt ?? job.createdAt).toLocaleString("th-TH")}
          </p>
        </header>

        <section className="rounded-lg border border-foreground/10 bg-white p-6 shadow-sm dark:bg-black">
          <h2 className="text-lg font-semibold">รายละเอียดงาน</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {job.description}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <ContactForm jobId={job.jobId} />
          <ReportForm jobId={job.jobId} />
        </div>
      </div>
    </div>
  );
}
