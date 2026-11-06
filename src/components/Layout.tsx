import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: '今日', mark: '今', end: true },
  { to: '/calendar', label: '日历', mark: '历' },
  { to: '/timeline', label: '回忆', mark: '忆' },
  { to: '/settings', label: '设置', mark: '设' },
]

export function Layout() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="app-nav" aria-label="主导航">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <span className="nav-mark" aria-hidden>
              {link.mark}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
