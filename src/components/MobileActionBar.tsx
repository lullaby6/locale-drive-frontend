import { useEffect, useRef } from "react";
import type { ChangeEvent, JSX, ReactNode } from "react";

import { Icon } from "@iconify/react";

import SearchField from "@/components/SearchField";
import { SORT_OPTIONS } from "@/components/Toolbar";
import { useT } from "@/i18n";
import useGlobalStore from "@/store/global";

import type { Order, SortBy } from "@/types";

function BarButton({
	icon,
	label,
	onClick,
	active = false,
	primary = false,
	danger = false,
	disabled = false,
	children,
}: {
	icon: string;
	label: string;
	onClick?: () => void;
	active?: boolean;
	primary?: boolean;
	danger?: boolean;
	disabled?: boolean;
	children?: ReactNode;
}) {
	const style = primary
		? "btn-primary"
		: active
			? "bg-primary/15 text-primary border-transparent"
			: danger
				? "btn-ghost text-error"
				: "btn-ghost";

	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`btn relative flex-1 h-12 px-0 rounded-field ${style}`}
			aria-label={label}
			aria-pressed={active || undefined}
		>
			<Icon icon={icon} width="1em" height="1em" className="text-2xl" />
			{children}
		</button>
	);
}

/** Sort button that opens the phone's native picker (a transparent <select> on top of it). */
function SortButton() {
	const t = useT();
	const sortBy = useGlobalStore(state => state.sortBy);
	const orderBy = useGlobalStore(state => state.orderBy);
	const setSort = useGlobalStore(state => state.setSort);

	function handleChange(event: ChangeEvent<HTMLSelectElement>) {
		const [column, order] = event.target.value.split(":") as [SortBy, Order];
		setSort(column, order);
	}

	return (
		<div className="relative flex-1 flex">
			<BarButton icon="tabler:arrows-sort" label={t.toolbar.sortBy} />
			<select
				value={`${sortBy}:${orderBy}`}
				onChange={handleChange}
				className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
				aria-label={t.toolbar.sortBy}
			>
				{SORT_OPTIONS.map(option => (
					<option key={option} value={option}>
						{t.toolbar.sort[option]}
					</option>
				))}
			</select>
		</div>
	);
}

/** Replaces the bar while items are selected: count, select all, download, move and delete. */
function SelectionBar() {
	const t = useT();
	const selected = useGlobalStore(state => state.selected);
	const entries = useGlobalStore(state => state.entries);
	const loading = useGlobalStore(state => state.loading);
	const download = useGlobalStore(state => state.download);
	const openDialog = useGlobalStore(state => state.openDialog);
	const setSelected = useGlobalStore(state => state.setSelected);
	const clearSelection = useGlobalStore(state => state.clearSelection);

	const selectedEntries = entries.filter(entry => selected.includes(entry.path));
	const allSelected = selected.length === entries.length;
	const singleFile = selectedEntries.length === 1 && selectedEntries[0].type === "file";

	return (
		<>
			<div className="flex items-center gap-2 px-1">
				<button onClick={clearSelection} className="btn btn-ghost btn-circle btn-sm" aria-label={t.location.clearSelection}>
					<Icon icon="tabler:x" width="1em" height="1em" className="text-xl" />
				</button>
				<span className="grow text-sm font-semibold">{t.location.selected(selected.length)}</span>
			</div>

			<div className="flex gap-1">
				<BarButton
					icon="tabler:checks"
					label={t.location.selectAll}
					onClick={() => setSelected(entries.map(entry => entry.path))}
					disabled={allSelected}
				/>
				<BarButton
					icon={singleFile ? "tabler:download" : "tabler:file-zip"}
					label={singleFile ? t.common.download : t.common.downloadZip}
					onClick={() => download(selectedEntries)}
				/>
				<BarButton icon="tabler:folder-symlink" label={t.common.move} onClick={() => openDialog({ kind: "move", paths: selected })} disabled={loading} />
				<BarButton icon="tabler:trash" label={t.common.delete} onClick={() => openDialog({ kind: "delete", paths: selected })} disabled={loading} danger />
			</div>
		</>
	);
}

/**
 * Phones only: the toolbar as an icon bar pinned to the bottom of the screen, within thumb
 * reach. The search button opens the search field right above the buttons.
 */
export default (): JSX.Element => {
	const t = useT();
	const loading = useGlobalStore(state => state.loading);
	const searchOpen = useGlobalStore(state => state.searchOpen);
	const selecting = useGlobalStore(state => state.selected.length > 0);
	const searching = useGlobalStore(state => state.query !== "");
	const setSearchOpen = useGlobalStore(state => state.setSearchOpen);
	const refresh = useGlobalStore(state => state.refresh);
	const openDialog = useGlobalStore(state => state.openDialog);

	const barRef = useRef<HTMLElement>(null);

	// Publish the bar's height (it grows when search opens) so the page, the upload panel and
	// the toasts can keep clear of it: see --mobile-bar-height in App.tsx, UploadPanel and global.css.
	useEffect(() => {
		const bar = barRef.current;
		if (!bar) return;

		const root = document.documentElement;
		const update = () => root.style.setProperty("--mobile-bar-height", `${bar.offsetHeight}px`);
		const observer = new ResizeObserver(update);

		observer.observe(bar);
		update();

		return () => {
			observer.disconnect();
			root.style.removeProperty("--mobile-bar-height");
		};
	}, []);

	function toggleSearch() {
		const next = !searchOpen;
		setSearchOpen(next);

		if (next) {
			// Focus right away so the keyboard opens in the same tap.
			requestAnimationFrame(() => document.getElementById("search")?.focus());
		}
	}

	return (
		<nav
			ref={barRef}
			className="sm:hidden fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 px-2 pt-2 border-t border-subtle bg-base-100/95 backdrop-blur"
			style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
			aria-label={t.toolbar.actions}
		>
			{selecting ? (
				<SelectionBar />
			) : (
			<>
			{searchOpen && <SearchField className="w-full" />}

			<div className="flex gap-1">
			<BarButton icon={searchOpen ? "tabler:search-off" : "tabler:search"} label={t.toolbar.search} onClick={toggleSearch} active={searchOpen}>
				{searching && !searchOpen && <span className="absolute top-2 right-[calc(50%-1rem)] size-2 rounded-full bg-primary" />}
			</BarButton>

			<SortButton />

			<BarButton icon="tabler:reload" label={t.toolbar.reload} onClick={() => refresh()} disabled={loading} />

			<BarButton icon="tabler:folder-plus" label={t.toolbar.newFolder} onClick={() => openDialog({ kind: "newFolder" })} disabled={loading} />

			<BarButton icon="tabler:upload" label={t.toolbar.upload} onClick={() => document.getElementById("files")?.click()} primary />
			</div>
			</>
			)}
		</nav>
	);
};
