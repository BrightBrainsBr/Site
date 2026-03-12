// frontend/features/assessment/components/fields/SectionTitle.tsx
'use client'

interface SectionTitleProps {
  icon: string
  title: string
  subtitle?: string
  badge?: string
}

export function SectionTitle({
  icon,
  title,
  subtitle,
  badge,
}: SectionTitleProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {badge && (
          <span className="rounded-full bg-lime-400/20 px-3 py-0.5 text-xs font-medium text-lime-400">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="text-sm text-zinc-400 ml-9">{subtitle}</p>}
    </div>
  )
}
