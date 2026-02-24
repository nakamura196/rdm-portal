"use client";

import { useAuth } from "@/hooks/useAuth";
import { useFetchProjects } from "@/hooks/useFetchNodes";
import Hero from "./components/Hero";
import Loading from "./components/Loading";
import Link from "next/link";

const PUBLIC_PROJECT_IDS = (
  process.env.NEXT_PUBLIC_PUBLIC_PROJECT_IDS || "j7pzu"
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <Loading message="認証情報を確認中..." />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <Hero />
        <PublicProjectLinks />
      </>
    );
  }

  return <ProjectList />;
}

function PublicProjectLinks() {
  if (PUBLIC_PROJECT_IDS.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          公開プロジェクト
        </h2>
        <p className="text-slate-500 mt-1">
          ログインなしで閲覧できるプロジェクト
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PUBLIC_PROJECT_IDS.map((id) => (
          <Link
            key={id}
            href={`/projects/${id}`}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-slate-100"
          >
            <h3 className="font-semibold text-lg text-slate-800 mb-2">
              {id}
            </h3>
            <p className="text-sm text-slate-500">
              公開プロジェクトを閲覧
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProjectList() {
  const { projects, loading, error } = useFetchProjects();

  if (loading) {
    return <Loading message="プロジェクトを読み込み中..." />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">
          プロジェクト一覧
        </h2>
        <p className="text-slate-500 mt-1">
          GakuNin RDMのプロジェクトを選択してください
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
          プロジェクトが見つかりません
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-slate-100"
            >
              <h3 className="font-semibold text-lg text-slate-800 mb-2">
                {project.attributes.title}
              </h3>
              {project.attributes.description && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                  {project.attributes.description}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {project.attributes.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-400">
                更新: {new Date(project.attributes.date_modified).toLocaleDateString("ja-JP")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
