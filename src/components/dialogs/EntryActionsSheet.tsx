import type { JSX } from "react";

import { Icon } from "@iconify/react";

import EntryIcon from "@/components/EntryIcon";
import Modal from "@/components/Modal";
import { useT } from "@/i18n";
import { getFileUrl } from "@/services/files";
import useGlobalStore from "@/store/global";

import type { Entry } from "@/types";

/**
 * Phones: the "⋮" actions of a file or folder as a bottom sheet (Modal is a bottom sheet on
 * small screens), so it never runs off the screen like a dropdown would.
 */
export default function EntryActionsSheet({ entry, onClose }: { entry: Entry; onClose: () => void }): JSX.Element {
	const t = useT();
	const openEntry = useGlobalStore(state => state.openEntry);
	const download = useGlobalStore(state => state.download);
	const openDialog = useGlobalStore(state => state.openDialog);

	const isFolder = entry.type === "folder";

	// Actions that open another dialog replace this one; the rest just close it.
	const actions: { icon: string; label: string; run: () => void; danger?: boolean; href?: string }[] = [
		{ icon: isFolder ? "tabler:folder-open" : "tabler:eye", label: isFolder ? t.common.open : t.common.preview, run: () => { onClose(); openEntry(entry); } },
		...(isFolder ? [] : [{ icon: "tabler:external-link", label: t.common.openInNewTab, run: onClose, href: getFileUrl(entry.path) }]),
		{ icon: isFolder ? "tabler:file-zip" : "tabler:download", label: isFolder ? t.common.downloadAsZip : t.common.download, run: () => { onClose(); download([entry]); } },
		{ icon: "tabler:folder-symlink", label: t.common.move, run: () => openDialog({ kind: "move", paths: [entry.path] }) },
		{ icon: "tabler:copy", label: t.common.duplicate, run: () => openDialog({ kind: "duplicate", entry }) },
		{ icon: "tabler:pencil", label: t.common.rename, run: () => openDialog({ kind: "rename", entry }) },
		{ icon: "tabler:trash", label: t.common.delete, run: () => openDialog({ kind: "delete", paths: [entry.path] }), danger: true },
	];

	return (
		<Modal title={entry.name} onClose={onClose} className="pb-[max(1.5rem,env(safe-area-inset-bottom))]">
			<div className="flex items-center gap-3 -mt-2">
				<EntryIcon entry={entry} className="text-2xl" />
				<span className="text-sm opacity-60">{t.kinds[isFolder ? "folder" : "file"]}</span>
			</div>

			<ul className="menu w-full p-0 gap-0.5 text-base">
				{actions.map(action => (
					<li key={action.label}>
						{action.href ? (
							<a href={action.href} target="_blank" rel="noreferrer" onClick={action.run} className="py-3">
								<Icon icon={action.icon} width="1em" height="1em" className="text-xl" />
								{action.label}
							</a>
						) : (
							<button onClick={action.run} className={`py-3 ${action.danger ? "text-error" : ""}`}>
								<Icon icon={action.icon} width="1em" height="1em" className="text-xl" />
								{action.label}
							</button>
						)}
					</li>
				))}
			</ul>
		</Modal>
	);
}
