export default function Loading({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4" />
      <p className="text-slate-500">{message || "読み込み中..."}</p>
    </div>
  );
}
