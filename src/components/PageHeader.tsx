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
    <header className="mb-4 sm:mb-6">
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon ? <span className="text-faint">{icon}</span> : null}
            <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance sm:text-2xl">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle ? (
            <p className="mt-0.5 text-xs leading-snug text-muted sm:text-sm">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="flex-shrink-0">{action}</div> : null}
      </div>
      <hr className="mt-3 border-0 border-t border-divider sm:mt-4" />
    </header>
  )
}
