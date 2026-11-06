import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: '今日', end: true },
  { to: '/calendar', label: '日历' },
  { to: '/timeline', label: '回忆' },
  { to: '/settings', label: '设置' },
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
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
