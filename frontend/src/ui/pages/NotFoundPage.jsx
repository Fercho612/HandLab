import { Link } from 'react-router'
import AppFrame from '../layout/AppFrame.jsx'
import controls from '../shared/controls.module.css'
import styles from './Page.module.css'

export default function NotFoundPage() {
  return (
    <AppFrame>
      <div className={styles.notFound}>
        <h1 className={styles.title}>Página no encontrada</h1>
        <p className={styles.lead}>La dirección no existe o cambió.</p>
        <Link to="/" className={controls.button}>
          Volver al inicio
        </Link>
      </div>
    </AppFrame>
  )
}
