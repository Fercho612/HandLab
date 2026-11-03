/** Converts pointer coordinates (CSS pixels) to court meters using the SVG's current transform. */
export function toCourtPoint(svg, event) {
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse())
  return { x: point.x, y: point.y }
}
