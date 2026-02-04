import { type ReactNode } from "react"

interface SurveyFormSectionProps {
  label?: string
  description?: string
  children: ReactNode
  className?: string
}

export function SurveyFormSection({
  label,
  description,
  children,
  className = "",
}: SurveyFormSectionProps) {
  return (
    <section className={`space-y-2 ${className}`}>
      {label != null && (
        <h3 className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </h3>
      )}
      {description != null && (
        <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
      )}
      <div className="space-y-2">{children}</div>
    </section>
  )
}
