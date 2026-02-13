import { useRef, useEffect, useState } from "react";
import { Button } from "@headlessui/react";
import { Send } from "lucide-react";
import { useDarkMode } from "../../lib/useDarkMode";

export type LocalComment = {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
};

const borderClass = "border-[var(--color-border)]";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function CommentPanel({
  comments,
  onAddComment,
  authorName,
}: {
  comments: LocalComment[];
  onAddComment: (body: string) => void;
  authorName: string;
}) {
  const isDark = useDarkMode();
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comments]);

  const matrixColor = isDark ? "#00ff41" : "#008c2a";

  return (
    <div
      className={`flex w-full flex-col border-t ${borderClass} bg-[var(--color-bg-elevated)]`}
      style={{ minHeight: "120px" }}
    >
      <div
        className="shrink-0 border-b px-3 py-2 text-xs font-medium tracking-wide"
        style={{ color: matrixColor, fontFamily: "var(--font-hacker-mono)" }}
      >
        コメント（画面にのみ表示・DBには保存しません）
      </div>
      {/* 高さは5件分で固定、それ以上はスクロール */}
      <div
        ref={listRef}
        className="shrink-0 space-y-2 overflow-y-auto p-3"
        style={{ height: "22rem" }}
      >
        {comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">まだコメントはありません</p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-none border px-2.5 py-2 text-sm ${borderClass}`}
              style={{
                backgroundColor: "var(--color-bg-survey)",
                fontFamily: "var(--font-hacker-neo)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium" style={{ color: matrixColor }}>
                  {c.author_name || "匿名"}
                </span>
                <span className="shrink-0 text-xs text-[var(--color-text-muted)]">{formatTime(c.created_at)}</span>
              </div>
              <p className="mt-1 break-words text-[var(--color-text)]">{c.body}</p>
            </div>
          ))
        )}
      </div>
      <CommentInput onAddComment={onAddComment} authorName={authorName} matrixColor={matrixColor} />
    </div>
  );
}

function CommentInput({
  onAddComment,
  authorName: _authorName,
  matrixColor,
}: {
  onAddComment: (body: string) => void;
  authorName: string;
  matrixColor: string;
}) {
  const [input, setInput] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = input.trim();
    if (!body) return;
    onAddComment(body);
    setInput("");
  };
  return (
    <div className={`shrink-0 border-t p-2 ${borderClass}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="コメントを入力..."
          maxLength={2000}
          className="min-w-0 flex-1 rounded-none border bg-[var(--color-bg)] px-2.5 py-1.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
          style={{
            borderColor: "var(--color-form-border)",
            fontFamily: "var(--font-hacker-neo)",
          }}
        />
        <Button
          type="submit"
          disabled={!input.trim()}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-none border transition disabled:opacity-40"
          style={{
            borderColor: matrixColor === "#00ff41" ? "rgba(0, 255, 65, 0.6)" : "rgba(0, 140, 42, 0.7)",
            color: matrixColor,
            fontFamily: "var(--font-hacker-mono)",
          }}
          aria-label="送信"
        >
          <Send className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
