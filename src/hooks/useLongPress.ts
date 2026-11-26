import { useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";

const DELAY = 450;
const MOVE_TOLERANCE = 10;

/** True on phones/tablets, where there is no hover and HTML drag & drop is unreliable. */
export const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

/**
 * Touch and hold to run `onLongPress` (used to start selecting on phones, like Google Drive).
 * The tap that ends a long press is swallowed so it doesn't also open the item.
 */
export default function useLongPress(onLongPress: () => void) {
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const start = useRef<{ x: number; y: number } | null>(null);
	const fired = useRef(false);

	function cancel() {
		if (timer.current) clearTimeout(timer.current);
		timer.current = null;
		start.current = null;
	}

	return {
		onPointerDown: (event: PointerEvent) => {
			if (event.pointerType !== "touch") return;

			fired.current = false;
			start.current = { x: event.clientX, y: event.clientY };
			timer.current = setTimeout(() => {
				fired.current = true;
				navigator.vibrate?.(15);
				onLongPress();
			}, DELAY);
		},
		onPointerMove: (event: PointerEvent) => {
			if (!start.current) return;
			if (Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > MOVE_TOLERANCE) cancel();
		},
		onPointerUp: cancel,
		onPointerCancel: cancel,
		// Keep the phone's own long-press menu (copy image, etc.) from showing up.
		onContextMenu: (event: MouseEvent) => {
			if (isTouchDevice) event.preventDefault();
		},
		onClickCapture: (event: MouseEvent) => {
			if (!fired.current) return;
			fired.current = false;
			event.stopPropagation();
			event.preventDefault();
		},
	};
}
