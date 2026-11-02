import Whiteboard from '../whiteboard/Whiteboard.jsx'
import styles from './Page.module.css'

export default function WhiteboardPage() {
  return (
    <main className={styles.page}>
      <h1>Pizarra</h1>
      <p>Agrega pasos y mueve a los jugadores o la pelota en cada uno.</p>
      <Whiteboard />
    </main>
  )
}
