import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

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
};

async function fetchJobs(): Promise<{
  jobs: Job[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        jobs: [],
        error: `API ตอบกลับด้วยสถานะ ${response.status}`,
      };
    }

    const data = (await response.json()) as Job[];
    const approvedJobs = data.filter((job) => job.isApproved && !job.isClosed);

    return { jobs: approvedJobs };
  } catch (error) {
    console.error("Failed to fetch jobs from API", error);
    return {
      jobs: [],
      error: "ไม่สามารถเชื่อมต่อกับ API ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์รันอยู่",
    };
  }
}

export default async function Home() {
  const { jobs, error } = await fetchJobs();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">
            งานที่เปิดรับสมัคร
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            คัดสรรตำแหน่งงานจากบริษัทพันธมิตร อัปเดตใหม่อยู่เสมอเพื่อให้คุณไม่พลาดโอกาสดี ๆ
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href="/auth/login"
              className="rounded-md border border-foreground/20 px-3 py-2 font-medium hover:border-foreground/40"
            >
              ไปที่หน้าเข้าสู่ระบบ
            </Link>
            <Link
              href="/auth/register"
              className="rounded-md border border-foreground/20 px-3 py-2 font-medium hover:border-foreground/40"
            >
              สมัครสมาชิกใหม่
            </Link>
            <Link
              href="/jobs/post"
              className="rounded-md bg-foreground px-3 py-2 font-medium text-background transition hover:opacity-90"
            >
              โพสต์ประกาศงาน
            </Link>
          </div>
        </header>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          {jobs.length === 0 ? (
            <p className="rounded-md border border-dashed border-foreground/20 p-6 text-center text-sm text-foreground/70">
              ขณะนี้ยังไม่มีงานที่เปิดรับในระบบ โปรดลองกลับมาใหม่หรือสมัครรับข่าวสารกับเรา
            </p>
          ) : (
            jobs.map((job) => (
              <Link key={job.jobId} href={`/jobs/${job.jobId}`}>
                <article className="h-full rounded-lg border border-foreground/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-black">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-xl font-semibold">{job.title}</h2>
                    <span className="text-xs uppercase tracking-wide text-foreground/60">
                      {new Date(job.createdAt).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground/70">
                    {job.company} • {job.location}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-foreground/60">
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
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                    {job.description}
                  </p>
                </article>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
