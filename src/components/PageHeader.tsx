// Notion-style page title block: large heading, optional subtitle, thin divider.
export function PageHeader({
  title,
  subtitle,
  icon,
  badge,
  action,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {icon ? <span className="text-faint">{icon}</span> : null}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle ? (
            <p className="mt-1 text-sm leading-relaxed text-muted">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="flex-shrink-0">{action}</div> : null}
      </div>
      <hr className="mt-4 border-0 border-t border-divider" />
    </header>
  )
}
