import { useRef } from "react";
import type { ChangeEvent, JSX } from "react";

import { Icon } from "@iconify/react";

import SearchField from "@/components/SearchField";
import useIsMobile from "@/hooks/useIsMobile";
import { useT } from "@/i18n";
import useGlobalStore from "@/store/global";

import type { Translations } from "@/languages/en";
import type { Order, SortBy } from "@/types";

type SortOption = keyof Translations["toolbar"]["sort"];

export const SORT_OPTIONS: SortOption[] = [
	"modificationDate:desc",
	"modificationDate:asc",
	"filename:asc",
	"filename:desc",
	"size:desc",
	"size:asc",
	"creationDate:desc",
	"creationDate:asc",
];

function ViewToggle(): JSX.Element {
	const t = useT();
	const view = useGlobalStore(state => state.view);
	const setView = useGlobalStore(state => state.setView);

	const button = (mode: "list" | "grid", icon: string, label: string) => (
		<button
			onClick={() => setView(mode)}
			className={`btn join-item px-3 ${view === mode ? "btn-primary" : "btn-subtle"}`}
			aria-label={label}
			aria-pressed={view === mode}
			data-tooltip-id="tooltip"
			data-tooltip-content={label}
		>
			<Icon icon={icon} width="1em" height="1em" className="text-xl" />
		</button>
	);

	return (
		<div className="join">
			{button("list", "tabler:list", t.toolbar.listLayout)}
			{button("grid", "tabler:layout-grid", t.toolbar.gridLayout)}
		</div>
	);
}

function SortSelect(): JSX.Element {
	const t = useT();
	const sortBy = useGlobalStore(state => state.sortBy);
	const orderBy = useGlobalStore(state => state.orderBy);
	const setSort = useGlobalStore(state => state.setSort);

	function handleChange(event: ChangeEvent<HTMLSelectElement>) {
		const [column, order] = event.target.value.split(":") as [SortBy, Order];
		setSort(column, order);
	}

	return (
		<label className="select w-full lg:w-60" aria-label={t.toolbar.sortBy}>
			<Icon icon="tabler:arrows-sort" width="1em" height="1em" className="opacity-50 text-lg" />
			<select value={`${sortBy}:${orderBy}`} onChange={handleChange}>
				{SORT_OPTIONS.map(option => (
					<option key={option} value={option}>
						{t.toolbar.sort[option]}
					</option>
				))}
			</select>
		</label>
	);
}

export default (): JSX.Element => {
	const t = useT();
	const loading = useGlobalStore(state => state.loading);
	const view = useGlobalStore(state => state.view);
	const refresh = useGlobalStore(state => state.refresh);
	const uploadFiles = useGlobalStore(state => state.uploadFiles);
	const openDialog = useGlobalStore(state => state.openDialog);
	const isMobile = useIsMobile();

	const inputFilesRef = useRef<HTMLInputElement>(null);

	function openFilePicker() {
		const input = inputFilesRef.current;
		if (!input) return;

		input.value = "";
		input.click();
	}

	function handleInputFilesChange(event: ChangeEvent<HTMLInputElement>) {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		uploadFiles(Array.from(files));
	}

	return (
		<>
		{/* Outside the card: the mobile bar and Shift+U open it even while the card is hidden. */}
		<input
			ref={inputFilesRef}
			onChange={handleInputFilesChange}
			type="file"
			name="files"
			id="files"
			multiple
			className="hidden"
		/>

		{/* Desktop toolbar. On phones these actions (and the search field) live in MobileActionBar. */}
		<div className="hidden sm:flex flex-col lg:flex-row justify-between items-center gap-3 p-4 rounded-box border border-subtle bg-base-100">
			{!isMobile && <SearchField className="w-full lg:w-1/3" />}

			<div className="flex flex-row flex-wrap items-center justify-end gap-3 w-full lg:w-fit">
				<div className="flex items-center gap-3 w-full sm:w-auto">
					{view === "grid" && <SortSelect />}
					<ViewToggle />
				</div>

				<button onClick={() => refresh()} disabled={loading} className="btn btn-subtle w-full sm:w-fit">
					<Icon icon="tabler:reload" width="1em" height="1em" className="text-xl" />
					{t.toolbar.reload}
				</button>

				<button
					onClick={() => openDialog({ kind: "newFolder" })}
					disabled={loading}
					className="btn btn-subtle w-full sm:w-fit"
				>
					<Icon icon="tabler:folder-plus" width="1em" height="1em" className="text-xl" />
					{t.toolbar.newFolder}
				</button>

				<button onClick={openFilePicker} className="btn btn-primary w-full sm:w-fit">
					<Icon icon="tabler:upload" width="1em" height="1em" className="text-xl" />
					{t.toolbar.upload}
				</button>
			</div>
		</div>
		</>
	);
};
