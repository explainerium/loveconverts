export interface RecentFile {
  id: string;
  action: string;
  fileName: string;
  fromFormat: string;
  toFormat: string;
  originalSize: number;
  outputSize: number;
  timestamp: number;
  toolUrl: string;
}

const STORAGE_KEY = "lc_recent_files";
const MAX_ITEMS = 10;

export function getRecentFiles(): RecentFile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentFile[];
  } catch {
    return [];
  }
}

export function addRecentFile(entry: Omit<RecentFile, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  try {
    const items = getRecentFiles();
    const newItem: RecentFile = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    const updated = [newItem, ...items].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearRecentFiles() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString();
}
