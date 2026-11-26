import { useSyncExternalStore } from "react";

/** Same breakpoint as Tailwind's `sm`: below 640px is treated as a phone. */
const query = window.matchMedia("(max-width: 639px)");

function subscribe(onChange: () => void) {
	query.addEventListener("change", onChange);
	return () => query.removeEventListener("change", onChange);
}

/** True on phone-sized screens; updates when the window is resized or rotated. */
export default function useIsMobile() {
	return useSyncExternalStore(subscribe, () => query.matches);
}
