"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok && data.code === 0) {
        setSuccess("登录成功，正在跳转...");
        router.replace("/admin");
      } else {
        setError(data.message ?? "登录失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10 md:px-10">
      <div className="grid w-full gap-8 rounded-[2rem] border border-black/5 bg-white/85 p-8 shadow-[0_24px_80px_rgba(34,58,45,0.08)] md:grid-cols-[1.1fr_0.9fr] md:p-10">
        <div className="space-y-4">
          <p className="text-sm font-semibold tracking-[0.24em] text-emerald-800/70 uppercase">
            Admin Login
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">后台登录</h1>
          <p className="max-w-xl text-sm leading-8 text-slate-600">
            使用管理员账号登录后台管理面板。种子数据默认账号为
            <span className="mx-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-sm">
              admin
            </span>
            /
            <span className="mx-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-sm">
              admin123456
            </span>
            。
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[1.5rem] bg-slate-950 p-6 text-slate-50"
        >
          <label className="block space-y-2 text-sm">
            <span>用户名</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-50 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="admin"
              value={form.username}
              onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))}
              required
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span>密码</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-50 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
              required
            />
          </label>

          {error ? (
            <p className="rounded-xl bg-red-900/20 px-4 py-2 text-xs text-red-300">{error}</p>
          ) : null}
          {success ? (
            <p className="rounded-xl bg-emerald-900/20 px-4 py-2 text-xs text-emerald-300">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-white px-5 py-3 font-medium text-slate-950 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>

          <p className="pt-2 text-center text-xs text-slate-400">
            当前没有内置兜底登录，账号请以数据库中的用户为准。
          </p>
        </form>
      </div>
    </div>
  );
}
