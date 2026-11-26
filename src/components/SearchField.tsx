import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, JSX } from "react";

import { Icon } from "@iconify/react";

import { useT } from "@/i18n";
import useGlobalStore from "@/store/global";

const SEARCH_DEBOUNCE = 400;

/**
 * The search input. Desktop shows it in the top toolbar; phones show it inside the bottom
 * action bar while search is open. Only one is mounted at a time (it has id="search").
 */
export default function SearchField({ className = "" }: { className?: string }): JSX.Element {
	const t = useT();
	const query = useGlobalStore(state => state.query);
	const setQuery = useGlobalStore(state => state.setQuery);

	const [value, setValue] = useState(query);
	const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	// The store clears the query when changing folders; keep the input in sync.
	useEffect(() => {
		setValue(current => (current.trim() === query ? current : query));
	}, [query]);

	useEffect(() => () => {
		if (searchTimeout.current) clearTimeout(searchTimeout.current);
	}, []);

	function handleSearch(event: ChangeEvent<HTMLInputElement>) {
		const next = event.target.value;
		setValue(next);

		if (searchTimeout.current) clearTimeout(searchTimeout.current);
		searchTimeout.current = setTimeout(() => setQuery(next.trim()), SEARCH_DEBOUNCE);
	}

	function clearQuery() {
		if (searchTimeout.current) clearTimeout(searchTimeout.current);
		setValue("");
		setQuery("");
	}

	return (
		<label className={`input ${className}`}>
			<Icon icon="tabler:search" width="1em" height="1em" className="opacity-50" />
			<input
				value={value}
				onChange={handleSearch}
				onKeyDown={event => {
					if (event.key !== "Escape") return;
					// First Esc clears the text, a second one leaves the field (and closes it on phones).
					if (value !== "") return clearQuery();
					event.currentTarget.blur();
					if (useGlobalStore.getState().searchOpen) useGlobalStore.getState().setSearchOpen(false);
				}}
				id="search"
				type="search"
				enterKeyHint="search"
				className="grow"
				placeholder={t.toolbar.searchPlaceholder}
				spellCheck={false}
				autoComplete="off"
			/>
			{value !== "" && (
				<button
					onClick={clearQuery}
					className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
					aria-label={t.toolbar.clearSearch}
				>
					<Icon icon="tabler:x" className="text-xl" />
				</button>
			)}
		</label>
	);
}
