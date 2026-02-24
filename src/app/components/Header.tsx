"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { isAuthenticated, user, signIn, signOut, isLoading } = useAuth();

  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-2xl">🎧</span>
          <div>
            <h1 className="text-lg font-bold leading-tight">
              RDM Audio Portal
            </h1>
            <p className="text-xs text-slate-400">
              GakuNin RDM 参照資料ポータル
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          {isAuthenticated && (
            <Link
              href="/"
              className="text-sm text-slate-300 hover:text-white transition"
            >
              プロジェクト一覧
            </Link>
          )}

          {isLoading ? (
            <span className="text-sm text-slate-400">読み込み中...</span>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-300">
                {user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="text-sm bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded transition"
            >
              GakuNin RDM でログイン
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
