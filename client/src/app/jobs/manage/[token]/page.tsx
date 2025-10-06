import { notFound } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { ManageJobForm } from "./ManageJobForm";

type JobManageDto = {
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

async function fetchManageJob(token: string): Promise<JobManageDto | null> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/manage/${token}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดข้อมูลประกาศได้ (${response.status})`);
  }

  return (await response.json()) as JobManageDto;
}

type Props = {
  params: { token: string };
};

export default async function ManageJobPage({ params }: Props) {
  const job = await fetchManageJob(params.token);

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">จัดการประกาศงาน</h1>
          <p className="text-sm text-foreground/70">
            ปรับปรุงเนื้อหา ปิดประกาศชั่วคราว หรือ ลบประกาศได้จากหน้านี้
          </p>
        </header>

        <ManageJobForm token={params.token} job={job} />
      </div>
    </div>
  );
}

