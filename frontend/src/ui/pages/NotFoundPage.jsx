import { Link } from 'react-router'
import styles from './Page.module.css'

export default function NotFoundPage() {
  return (
    <main className={styles.page}>
      <h1>Página no encontrada</h1>
      <Link to="/">Volver al inicio</Link>
    </main>
  )
}
