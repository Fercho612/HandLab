import Whiteboard from '../whiteboard/Whiteboard.jsx'
import styles from './Page.module.css'

export default function WhiteboardPage() {
  return (
    <main className={styles.page}>
      <h1>Pizarra</h1>
      <p>Arrastra un jugador o la pelota para grabar su movimiento.</p>
      <Whiteboard />
    </main>
  )
}
