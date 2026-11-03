import { Link } from 'react-router'
import AppFrame from '../layout/AppFrame.jsx'
import controls from '../shared/controls.module.css'
import CourtPreview from '../whiteboard/CourtPreview.jsx'
import styles from './Page.module.css'

export default function HomePage() {
  return (
    <AppFrame>
      <div className={styles.home}>
        <div className={styles.intro}>
          <h1 className={styles.title}>Pizarra táctica de handball</h1>
          <p className={styles.lead}>
            Arma jugadas paso a paso sobre media cancha, mueve a los jugadores y la pelota, y reprodúcelas para revisarlas.
          </p>
          <ul className={styles.facts}>
            <li>Hasta 7 jugadores por lado, con arquero opcional.</li>
            <li>Cada paso guarda la posición de todos y de la pelota.</li>
            <li>Al reproducir, cada transición dura 1 segundo.</li>
          </ul>
          <Link to="/pizarra" className={`${controls.button} ${controls.primary} ${styles.cta}`}>
            Abrir pizarra
          </Link>
        </div>
        <Link to="/pizarra" className={styles.preview} aria-label="Abrir pizarra con la formación inicial">
          <CourtPreview />
        </Link>
      </div>
    </AppFrame>
  )
}
