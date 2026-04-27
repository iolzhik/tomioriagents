import fs from 'fs';

const OVERLAY_PATH = '/tmp/tomiori_managers_overlay.json';

type AnyManager = Record<string, any>;
type OverlayData = {
  created: AnyManager[];
  updated: Record<string, Record<string, any>>;
  deleted: string[];
};

function emptyOverlay(): OverlayData {
  return { created: [], updated: {}, deleted: [] };
}

export function isReadonlyDbError(err: any): boolean {
  const msg = String(err?.message || '');
  return /readonly database|attempt to write a readonly database|no such table|does not exist|unable to open database file|database is locked|connection/i.test(msg);
}

function readOverlay(): OverlayData {
  try {
    if (!fs.existsSync(OVERLAY_PATH)) return emptyOverlay();
    const raw = fs.readFileSync(OVERLAY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      created: Array.isArray(parsed?.created) ? parsed.created : [],
      updated: parsed?.updated && typeof parsed.updated === 'object' ? parsed.updated : {},
      deleted: Array.isArray(parsed?.deleted) ? parsed.deleted : [],
    };
  } catch {
    return emptyOverlay();
  }
}

function writeOverlay(data: OverlayData): void {
  fs.writeFileSync(OVERLAY_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function applyManagerOverlay(baseManagers: AnyManager[]): AnyManager[] {
  const overlay = readOverlay();
  const baseById = new Map<string, AnyManager>();
  for (const m of baseManagers) baseById.set(String(m.id), { ...m });

  for (const id of overlay.deleted) {
    baseById.delete(String(id));
  }

  for (const [id, patch] of Object.entries(overlay.updated)) {
    if (baseById.has(id)) {
      baseById.set(id, { ...baseById.get(id), ...patch });
    }
  }

  const created = overlay.created
    .filter((m) => !overlay.deleted.includes(String(m.id)))
    .map((m) => ({ ...m, ...(overlay.updated[String(m.id)] || {}) }));

  return [...Array.from(baseById.values()), ...created];
}

export function overlayCreateManager(manager: AnyManager): AnyManager {
  const overlay = readOverlay();
  overlay.created.push(manager);
  overlay.deleted = overlay.deleted.filter((id) => id !== String(manager.id));
  writeOverlay(overlay);
  return manager;
}

export function overlayUpdateManager(id: string, patch: Record<string, any>): AnyManager {
  const overlay = readOverlay();
  const sid = String(id);
  const createdIdx = overlay.created.findIndex((m) => String(m.id) === sid);
  if (createdIdx !== -1) {
    overlay.created[createdIdx] = { ...overlay.created[createdIdx], ...patch };
  } else {
    overlay.updated[sid] = { ...(overlay.updated[sid] || {}), ...patch };
  }
  writeOverlay(overlay);
  return { id: sid, ...patch };
}

export function overlayDeleteManager(id: string): void {
  const overlay = readOverlay();
  const sid = String(id);
  overlay.created = overlay.created.filter((m) => String(m.id) !== sid);
  delete overlay.updated[sid];
  if (!overlay.deleted.includes(sid)) overlay.deleted.push(sid);
  writeOverlay(overlay);
}
