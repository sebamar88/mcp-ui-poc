import type { PropsWithChildren } from 'react'

interface AppLayoutProps extends PropsWithChildren {
  title: string
}

/**
 * Minimal application shell with a sticky header and padded main content area.
 * Keeps styling concerns in one place so individual pages can stay focused on data.
 */
export function AppLayout({ title, children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <h1>{title}</h1>
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  )
}
