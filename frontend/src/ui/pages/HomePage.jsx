import { Link } from 'react-router'
import styles from './Page.module.css'

export default function HomePage() {
  return (
    <main className={styles.page}>
      <h1>HandLab</h1>
      <p>Pizarra táctica de handball.</p>
      <Link to="/pizarra">Abrir pizarra</Link>
    </main>
  )
}
