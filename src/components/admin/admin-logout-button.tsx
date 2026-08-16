"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="mt-5 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5"
    >
      退出登录
    </button>
  );
}
