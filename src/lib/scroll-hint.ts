// Whether a sideways-scrolling row has more to the right: the phone's filter
// chips fade at the right edge until the last chip is in view. 1px of slack
// for sub-pixel scroll positions.
export function moreToRight(el: { scrollLeft: number; clientWidth: number; scrollWidth: number }) {
  return el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
}
