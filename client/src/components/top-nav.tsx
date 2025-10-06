"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readStoredUser,
  saveAuth,
  subscribeAuthChange,
} from "@/lib/auth-storage";

type NavUser =
  | {
      status: "authenticated";
      name: string;
      role: string;
    }
  | { status: "anonymous" };

export function TopNav() {
  const [navUser, setNavUser] = useState<NavUser>({ status: "anonymous" });

  useEffect(() => {
    const syncUser = () => {
      const stored = readStoredUser();
      if (stored?.user) {
        setNavUser({
          status: "authenticated",
          name: stored.user.name,
          role: stored.user.role,
        });
      } else {
        setNavUser({ status: "anonymous" });
      }
    };

    const stored = readStoredUser();
    if (stored?.user) {
      setNavUser({
        status: "authenticated",
        name: stored.user.name,
        role: stored.user.role,
      });
    }

    const unsubscribe = subscribeAuthChange(syncUser);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSignOut = () => {
    if (typeof window === "undefined") {
      return;
    }
    saveAuth();
  };

  const isAdmin =
    navUser.status === "authenticated" &&
    navUser.role.toLowerCase() === "admin";

  return (
    <header className="border-b border-foreground/10 bg-foreground/5">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm text-foreground">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-base font-semibold">
            Jobb Service
          </Link>
          {navUser.status === "authenticated" ? (
            <nav className="flex items-center gap-3 text-xs sm:text-sm">
              <Link
                href="/dashboard"
                className="rounded-md px-2 py-1 hover:bg-foreground/10"
              >
                แดชบอร์ด
              </Link>
              <Link
                href="/"
                className="rounded-md px-2 py-1 hover:bg-foreground/10"
              >
                ค้นหางาน
              </Link>
              {isAdmin ? (
                <>
                  <Link
                    href="/admin/jobs"
                    className="rounded-md px-2 py-1 hover:bg-foreground/10"
                  >
                    จัดการประกาศ
                  </Link>
                  <Link
                    href="/admin/reports"
                    className="rounded-md px-2 py-1 hover:bg-foreground/10"
                  >
                    รายงาน
                  </Link>
                </>
              ) : null}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm">
          {navUser.status === "authenticated" ? (
            <>
              <span className="rounded-full bg-foreground/10 px-2 py-1 font-medium">
                {navUser.name} ({isAdmin ? "Admin" : "Normal"})
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md border border-foreground/20 px-3 py-1 hover:border-foreground/40"
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-md border border-foreground/20 px-3 py-1 hover:border-foreground/40"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
