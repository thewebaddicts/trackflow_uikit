import type { WheelEvent } from "react";

/** A focused number input eats the wheel and changes its value; drop focus so the page scrolls instead. */
export function blurNumberInputOnWheel(event: WheelEvent<HTMLInputElement>): void {
  if (event.currentTarget === document.activeElement) {
    event.currentTarget.blur();
  }
}
