"use client";

import { useAuth } from "@/hooks/useAuth";

export default function Hero() {
  const { signIn } = useAuth();

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-5xl mb-6">🎧</div>
        <h1 className="text-4xl font-bold mb-4">
          RDM Audio Portal
        </h1>
        <p className="text-xl text-blue-200 mb-2">
          GakuNin RDM 参照資料ポータル
        </p>
        <p className="text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          読む時間がない方、英語を学びたい方のための音声学習プラットフォーム。
          <br />
          アーカイブズ学・OAIS・ブロックチェーンに関する音声資料を、
          AI要約付きで手軽に学べます。
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => signIn()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold text-lg transition shadow-lg"
          >
            GakuNin RDM でログイン
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
          <div className="bg-white/10 rounded-lg p-5 backdrop-blur">
            <div className="text-2xl mb-2">🔊</div>
            <h3 className="font-semibold mb-1">音声再生</h3>
            <p className="text-sm text-slate-300">
              Audible風の音声プレイヤーで、いつでもどこでも学習
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-5 backdrop-blur">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-semibold mb-1">AI要約</h3>
            <p className="text-sm text-slate-300">
              flier風のAI要約で、音声内容のポイントを素早く把握
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-5 backdrop-blur">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold mb-1">検索・管理</h3>
            <p className="text-sm text-slate-300">
              ファイル検索、アップロード、プロジェクト管理
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
