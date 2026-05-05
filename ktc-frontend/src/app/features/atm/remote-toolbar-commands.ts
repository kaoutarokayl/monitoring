/**
 * Filtre sur CommandTypes.commandname (insensible à la casse).
 * On normalise d’abord : préfixe ktc_ / KTC_, puis underscores → espaces
 * (ex. ktc_supervisor_on → « supervisor on », ktc_reboot → « reboot »).
 */
export const REMOTE_TOOLBAR_COMMAND_SUBSTRINGS: readonly string[] = [
  'refresh',
  'supervisor', // Supervisor On / Off même avec ktc_supervisor_on en base
  'reset device',
  'reboot',
  'shutdown',
  'package',
  'upload file',
  'upload screenshot',
  'upload trace',
  'trace backup',
  'upload event log',
  'upload registry',
  'upload diebold onetouch',
  'run atm script and upload results',
  'gather and upload files',
  'generate and upload issue report'
];

const UPLOAD_COMMAND_SUBSTRINGS: readonly string[] = [
  'upload file',
  'upload screenshot',
  'upload trace',
  'kalignite trace',
  'trace backup',
  'upload event log',
  'upload registry',
  'upload diebold onetouch',
  'run atm script and upload results',
  'gather and upload files',
  'generate and upload issue report'
];

const UPLOAD_COMMAND_ORDER: readonly string[] = [
  'upload file',
  'upload screenshot',
  'upload trace',
  'kalignite trace',
  'trace backup',
  'upload event log',
  'upload registry',
  'upload diebold onetouch',
  'run atm script and upload results',
  'gather and upload files',
  'generate and upload issue report'
];

/** Pour matching uniquement (minuscules, sans ktc_ ni underscores). */
export function normalizeCommandNameForMatch(name: string): string {
  let s = (name || '').trim();
  s = s.replace(/^ktc_/i, '');
  s = s.replace(/_/g, ' ');
  return s.toLowerCase().trim();
}

/** Libellé affiché : sans préfixe ktc_, underscores → espaces (ex. ktc_reboot → reboot). */
export function formatCommandDisplayLabel(name: string): string {
  let s = (name || '').trim();
  s = s.replace(/^ktc_/i, '');
  s = s.replace(/_/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

export function isRemoteToolbarCommandName(commandName: string): boolean {
  const n = normalizeCommandNameForMatch(commandName);
  if (!n) return false;
  return REMOTE_TOOLBAR_COMMAND_SUBSTRINGS.some((frag) => n.includes(frag));
}

/**
 * Toutes les variantes « Upload » (fichier, trace, registry, screenshot, etc.)
 * regroupées sous un seul bouton Upload — même logique que l’outil desktop.
 */
export function isUploadSubgroupCommand(commandName: string): boolean {
  const n = normalizeCommandNameForMatch(commandName);
  if (!n) return false;
  return UPLOAD_COMMAND_SUBSTRINGS.some((frag) => n.includes(frag));
}

function uploadCommandSortRank(commandName: string): number {
  const n = normalizeCommandNameForMatch(commandName);
  const index = UPLOAD_COMMAND_ORDER.findIndex((keyword) => n.includes(keyword));
  return index === -1 ? UPLOAD_COMMAND_ORDER.length : index;
}

export function filterRemoteToolbarCommands<T extends { commandName: string }>(rows: T[] | null | undefined): T[] {
  return (rows ?? []).filter((r) => isRemoteToolbarCommandName(r.commandName));
}

export function partitionToolbarCommands<T extends { commandName: string; commandId: number }>(
  rows: T[]
): { main: T[]; upload: T[] } {
  const toolbar = filterRemoteToolbarCommands(rows);
  const upload = toolbar
    .filter((r) => isUploadSubgroupCommand(r.commandName))
    .sort((a, b) => uploadCommandSortRank(a.commandName) - uploadCommandSortRank(b.commandName) || a.commandName.localeCompare(b.commandName));
  const uploadIds = new Set(upload.map((r) => r.commandId));
  const main = toolbar.filter((r) => !uploadIds.has(r.commandId));
  return { main, upload };
}
