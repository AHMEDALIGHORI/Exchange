import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Logo from './Logo'
import styles from './Navbar.module.css'

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Exchange', to: '/exchange' },
  { label: 'Wallet', to: '/wallet' },
  { label: 'Markets', to: '/markets' },
  { label: 'Blog', to: '/blog' },
]

export default function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
        <Link to="/" className={styles.logo} id="nav-logo">
          <Logo size={28} interactive />
          <span className={styles.logoBrand}>ExChange</span>
        </Link>

        <ul className={styles.navLinks}>
          {navLinks.map((link) => {
            const isActive = link.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(link.to)
            return (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  id={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className={styles.navActions}>
          <Link to="/signin" className={styles.signinBtn} id="nav-signin">
            Sign in
          </Link>
          <Link to="/signup" className={styles.signupBtn} id="nav-signup">
            Get started
          </Link>
          <Link to="/dashboard" className={styles.dashboardBtn} id="nav-dashboard">
            Dashboard
          </Link>
          <button
            className={styles.menuBtn}
            onClick={() => setIsMenuOpen(true)}
            id="nav-menu-btn"
            type="button"
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>
        </div>
      </nav>

      <div className={`${styles.drawer} ${isMenuOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerOverlay} onClick={() => setIsMenuOpen(false)} />
        <div className={styles.drawerContent}>
          <div className={styles.drawerHeader}>
            <Link to="/" className={styles.logo} onClick={() => setIsMenuOpen(false)}>
              <Logo size={28} interactive />
              <span className={styles.logoBrand}>ExChange</span>
            </Link>
            <button className={styles.closeBtn} onClick={() => setIsMenuOpen(false)} type="button" aria-label="Close menu">
              <CloseIcon />
            </button>
          </div>

          <ul className={styles.drawerLinks}>
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className={styles.drawerActions}>
            <Link to="/signin" className={styles.drawerSignin} onClick={() => setIsMenuOpen(false)}>
              Sign in
            </Link>
            <Link to="/signup" className={styles.drawerSignup} onClick={() => setIsMenuOpen(false)}>
              Get started
            </Link>
            <Link to="/dashboard" className={styles.drawerDashboard} onClick={() => setIsMenuOpen(false)}>
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
