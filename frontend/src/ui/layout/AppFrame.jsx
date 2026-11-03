import { Link, NavLink } from 'react-router'
import styles from './AppFrame.module.css'

const navClass = ({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Inicio',
    icon: 'M2 7.2 8 2l6 5.2V14H9.75v-4h-3.5v4H2z',
  },
  {
    to: '/pizarra',
    label: 'Pizarra',
    icon: 'M2 2h12v12H2zm1.5 1.5v9h9v-9zM5 3.5a3 3 0 0 0 6 0h-1.5a1.5 1.5 0 0 1-3 0z',
  },
]

/** App chrome: a vertical sidebar on the frame ground and a sheet that holds the page. */
export default function AppFrame({ children }) {
  return (
    <div className={styles.frame}>
      <header className={styles.sidebar}>
        <Link to="/" className={styles.wordmark}>
          <svg className={styles.mark} viewBox="0 0 20 20" aria-hidden="true">
            <rect width="20" height="20" rx="4" />
            <path d="M5 2.5 A 5 5 0 0 0 15 2.5" />
          </svg>
          HandLab
        </Link>
        <nav aria-label="Principal">
          <ul className={styles.nav}>
            {NAV_ITEMS.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink to={to} end className={navClass}>
                  <svg className={styles.navIcon} viewBox="0 0 16 16" aria-hidden="true">
                    <path d={icon} fillRule="evenodd" />
                  </svg>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className={styles.sheet}>{children}</main>
    </div>
  )
}
