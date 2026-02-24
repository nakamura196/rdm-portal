"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface SummaryCardProps {
  audioUrl: string;
  fileName: string;
}

export default function SummaryCard({
  audioUrl,
  fileName,
}: SummaryCardProps) {
  const { isAuthenticated } = useAuth();
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Transcribe
      setStep("音声を書き起こし中...");
      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl, fileName }),
      });

      if (!transcribeRes.ok) {
        const err = await transcribeRes.json();
        throw new Error(err.error || "書き起こしに失敗しました");
      }

      const { text } = await transcribeRes.json();
      setTranscript(text);

      // Step 2: Summarize
      setStep("AI要約を生成中...");
      const summarizeRes = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title: fileName }),
      });

      if (!summarizeRes.ok) {
        const err = await summarizeRes.json();
        throw new Error(err.error || "要約に失敗しました");
      }

      const { summary: summaryText } = await summarizeRes.json();
      setSummary(summaryText);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📝</span>
          <div>
            <h2 className="text-white font-bold text-lg">AI要約</h2>
            <p className="text-amber-100 text-sm">flier風サマリー</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!summary && !loading && (
          <div className="text-center py-8">
            {isAuthenticated ? (
              <>
                <p className="text-slate-500 mb-4">
                  AIが音声を書き起こし、要約を生成します
                </p>
                <button
                  onClick={generateSummary}
                  className="bg-amber-500 hover:bg-amber-400 text-white px-6 py-3 rounded-lg font-semibold transition shadow"
                >
                  📝 要約を生成
                </button>
              </>
            ) : (
              <p className="text-slate-500">
                AI要約を利用するにはログインが必要です
              </p>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mb-4" />
            <p className="text-slate-600 font-medium">{step}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
            <button
              onClick={generateSummary}
              className="mt-2 text-sm text-red-600 underline"
            >
              再試行
            </button>
          </div>
        )}

        {summary && (
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
              {summary}
            </div>
          </div>
        )}

        {transcript && (
          <details className="mt-6 border-t pt-4">
            <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
              書き起こしテキストを表示
            </summary>
            <div className="mt-3 bg-slate-50 rounded-lg p-4 text-sm text-slate-600 max-h-64 overflow-y-auto">
              {transcript}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
