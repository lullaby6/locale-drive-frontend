import { useEffect, useState } from "react";
import type { JSX } from "react";

import { Icon } from "@iconify/react";

import EntryIcon from "@/components/EntryIcon";
import Modal from "@/components/Modal";
import { useT } from "@/i18n";
import * as api from "@/services/files";
import useGlobalStore from "@/store/global";
import { splitPath } from "@/utils/utils";

import type { Entry } from "@/types";

const MAX_LISTED = 5;

function parentOf(path: string) {
	const index = path.lastIndexOf("/");
	return index === -1 ? "" : path.slice(0, index);
}

function nameOf(path: string) {
	return path.slice(path.lastIndexOf("/") + 1);
}

/** "Storage / Photos / 2024" style label for a folder path. */
function FolderPath({ path, storage }: { path: string; storage: string }) {
	return (
		<span className="flex items-center gap-1.5 min-w-0">
			<Icon icon={path ? "tabler:folder" : "tabler:home"} width="1em" height="1em" className="shrink-0 opacity-60" />
			<span className="truncate font-medium" title={path ? `${storage} / ${splitPath(path).join(" / ")}` : storage}>
				{[storage, ...splitPath(path)].join(" / ")}
			</span>
		</span>
	);
}

/** Step 1: browse the folders and pick the destination. */
function FolderPicker({
	paths,
	browseDir,
	setBrowseDir,
}: {
	paths: string[];
	browseDir: string;
	setBrowseDir: (dir: string) => void;
}) {
	const t = useT();
	const [folders, setFolders] = useState<Entry[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		setFolders(null);

		api.getEntries({ dir: browseDir, sort: "filename", order: "asc" })
			.then(result => {
				if (cancelled) return;
				// The items being moved can't be a destination (a folder can't go inside itself).
				setFolders(result.entries.filter(entry => entry.type === "folder" && !paths.includes(entry.path)));
			})
			.catch(() => !cancelled && setFolders([]));

		return () => {
			cancelled = true;
		};
	}, [browseDir, paths]);

	const segments = splitPath(browseDir);

	return (
		<>
			<div className="breadcrumbs text-sm py-0 overflow-y-hidden">
				<ul>
					<li>
						<button
							onClick={() => setBrowseDir("")}
							className={`flex items-center gap-1.5 cursor-pointer hover:text-primary ${segments.length === 0 ? "font-semibold" : "opacity-70"}`}
						>
							<Icon icon="tabler:home" width="1em" height="1em" />
							{t.common.storage}
						</button>
					</li>
					{segments.map((segment, index) => (
						<li key={index}>
							<button
								onClick={() => setBrowseDir(segments.slice(0, index + 1).join("/"))}
								className={`max-w-40 truncate cursor-pointer hover:text-primary ${index === segments.length - 1 ? "font-semibold" : "opacity-70"}`}
							>
								{segment}
							</button>
						</li>
					))}
				</ul>
			</div>

			<div className="flex flex-col h-64 overflow-y-auto rounded-field border border-subtle">
				{folders === null ? (
					<div className="flex grow justify-center items-center">
						<span className="loading loading-spinner text-primary" />
					</div>
				) : folders.length === 0 ? (
					<div className="flex flex-col grow justify-center items-center gap-2 text-sm opacity-60">
						<Icon icon="tabler:folder-off" width="1em" height="1em" className="text-3xl" />
						{t.dialogs.moveNoFolders}
					</div>
				) : (
					<ul className="flex flex-col p-1">
						{folders.map(folder => (
							<li key={folder.path}>
								<button
									onClick={() => setBrowseDir(folder.path)}
									className="flex items-center gap-3 w-full px-3 py-2.5 rounded-field text-left text-sm cursor-pointer hover:bg-base-content/5"
								>
									<Icon icon="tabler:folder-filled" width="1em" height="1em" className="shrink-0 text-xl text-amber-400" />
									<span className="grow truncate">{folder.name}</span>
									<Icon icon="tabler:chevron-right" width="1em" height="1em" className="shrink-0 opacity-40" />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</>
	);
}

/** Step 2: what is moved, from where and to where. */
function MoveSummary({ paths, destination }: { paths: string[]; destination: string }) {
	const t = useT();
	const entries = useGlobalStore(state => state.entries);

	const items = paths.map(path => entries.find(entry => entry.path === path) ?? { name: nameOf(path), type: "file" as const });
	const sources = Array.from(new Set(paths.map(parentOf)));

	return (
		<div className="flex flex-col gap-4">
			<ul className="flex flex-col gap-1.5 p-3 rounded-field border border-subtle bg-base-content/[0.03]">
				{items.slice(0, MAX_LISTED).map((item, index) => (
					<li key={index} className="flex items-center gap-2 min-w-0 text-sm">
						<EntryIcon entry={item} className="text-lg" />
						<span className="truncate">{item.name}</span>
					</li>
				))}
				{items.length > MAX_LISTED && <li className="pl-7 text-xs opacity-60">{t.dialogs.moveAndMore(items.length - MAX_LISTED)}</li>}
			</ul>

			<div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
				<span className="opacity-60">{t.dialogs.moveFrom}</span>
				{sources.length === 1 ? (
					<FolderPath path={sources[0]} storage={t.common.storage} />
				) : (
					<span className="font-medium">{t.dialogs.moveSeveralPlaces}</span>
				)}

				<span />
				<Icon icon="tabler:arrow-down" width="1em" height="1em" className="opacity-40" />

				<span className="opacity-60">{t.dialogs.moveTo}</span>
				<span className="text-primary">
					<FolderPath path={destination} storage={t.common.storage} />
				</span>
			</div>
		</div>
	);
}

/**
 * Moving always ends in a confirmation that says what goes from where to where.
 * Opened from a menu, the user picks the folder first; dropped on a folder, it starts at the confirmation.
 */
export default function MoveDialog({
	paths,
	destination,
	onClose,
}: {
	paths: string[];
	destination?: string;
	onClose: () => void;
}): JSX.Element {
	const t = useT();
	const entries = useGlobalStore(state => state.entries);
	const currentDir = useGlobalStore(state => state.dir);
	const moveEntries = useGlobalStore(state => state.moveEntries);

	const [browseDir, setBrowseDir] = useState(destination ?? currentDir);
	const [step, setStep] = useState<"pick" | "confirm">(destination === undefined ? "pick" : "confirm");
	const [moving, setMoving] = useState(false);

	const moved = entries.filter(entry => paths.includes(entry.path));
	const label = moved.length === 1 ? `“${moved[0].name}”` : t.common.items(paths.length);
	const alreadyHere = paths.every(path => parentOf(path) === browseDir);

	async function handleMove() {
		setMoving(true);
		const ok = await moveEntries(paths, browseDir);
		setMoving(false);
		if (ok) onClose();
	}

	if (step === "pick") {
		return (
			<Modal
				title={t.dialogs.moveTitle(label)}
				icon="tabler:folder-symlink"
				onClose={onClose}
				actions={
					<>
						<button onClick={onClose} className="btn btn-subtle">
							{t.common.cancel}
						</button>
						<button onClick={() => setStep("confirm")} disabled={alreadyHere} className="btn btn-primary">
							<Icon icon="tabler:folder-symlink" width="1em" height="1em" />
							{t.dialogs.moveHere}
						</button>
					</>
				}
			>
				<FolderPicker paths={paths} browseDir={browseDir} setBrowseDir={setBrowseDir} />

				{alreadyHere && (
					<p className="flex items-center gap-2 -mt-1 text-xs opacity-60">
						<Icon icon="tabler:info-circle" width="1em" height="1em" />
						{t.dialogs.moveAlreadyHere}
					</p>
				)}
			</Modal>
		);
	}

	return (
		<Modal
			title={t.dialogs.moveConfirmTitle}
			icon="tabler:folder-symlink"
			onClose={onClose}
			actions={
				<>
					{destination === undefined ? (
						<button onClick={() => setStep("pick")} disabled={moving} className="btn btn-subtle">
							<Icon icon="tabler:arrow-left" width="1em" height="1em" />
							{t.dialogs.back}
						</button>
					) : (
						<button onClick={onClose} className="btn btn-subtle">
							{t.common.cancel}
						</button>
					)}
					<button onClick={handleMove} disabled={moving} className="btn btn-primary" autoFocus>
						{moving ? <span className="loading loading-spinner loading-sm" /> : <Icon icon="tabler:folder-symlink" width="1em" height="1em" />}
						{t.common.move}
					</button>
				</>
			}
		>
			<MoveSummary paths={paths} destination={browseDir} />
		</Modal>
	);
}
