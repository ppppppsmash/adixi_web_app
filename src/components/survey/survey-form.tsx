import { type ReactNode } from "react"

interface SurveyFormProps {
  title?: string
  children?: ReactNode
  footer?: ReactNode
}

export function SurveyForm({
  title = "アンケート",
  children,
  footer,
}: SurveyFormProps) {
  return (
    <form
      className="flex h-full min-h-0 flex-col"
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      {/* ヘッダー: タイトル */}
      <header className="shrink-0 border-b border-[var(--color-border)] px-6 py-4">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
          {title}
        </h2>
      </header>

      {/* メイン: 質問一覧（スクロール想定） */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <fieldset className="space-y-6 border-0 p-0">
          <legend className="sr-only">アンケート項目</legend>
          {children}
        </fieldset>
      </div>

      {/* フッター: 送信ボタン等 */}
      {footer != null && (
        <footer className="shrink-0 border-t border-[var(--color-border)] px-6 py-4">
          {footer}
        </footer>
      )}
    </form>
  )
}
