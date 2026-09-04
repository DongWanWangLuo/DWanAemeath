// Admin config management
import { sakuraConfig } from '../config/effectsConfig';
import { backgroundWallpaper } from '../config/backgroundWallpaper';
import type { WALLPAPER_MODE } from '@/types/config';

const LK = (key: string) => `dw_admin_${key}`;

export function getAdminPasswordHash(): string | null {
  return localStorage.getItem(LK("password"));
}
export function setAdminPasswordHash(h: string): void { localStorage.setItem(LK("password"), h); }
export function clearAdminPassword(): void { localStorage.removeItem(LK("password")); }
export function isAdminLoggedIn(): boolean { return sessionStorage.getItem(LK("session")) === "1"; }
export function setAdminLoggedIn(): void { sessionStorage.setItem(LK("session"), "1"); }
export function clearAdminSession(): void { sessionStorage.removeItem(LK("session")); }
export function getGitHubToken(): string { return localStorage.getItem(LK("github_token")) ?? ""; }
export function setGitHubToken(t: string): void { localStorage.setItem(LK("github_token"), t); }
export function getGitHubRepo(): string { return localStorage.getItem(LK("github_repo")) ?? ""; }
export function setGitHubRepo(r: string): void { localStorage.setItem(LK("github_repo"), r); }
function getBool(key: string, fb: boolean): boolean {
  const s = localStorage.getItem(LK(key));
  if (s === null) return fb;
  return s === "true";
}
function setBool(key: string, v: boolean): void { localStorage.setItem(LK(key), String(v)); }

export const getStoredSakuraEnabled = () => getBool("sakura_enabled", sakuraConfig.enable);
export const setStoredSakuraEnabled = (v: boolean) => { setBool("sakura_enabled", v); window.dispatchEvent(new CustomEvent("dw_sakura_toggle", { detail: { enabled: v } })); };
export const getStoredWavesEnabled = () => getBool("waves_enabled", backgroundWallpaper.common?.waves?.enable?.desktop ?? true);
export const setStoredWavesEnabled = (v: boolean) => { setBool("waves_enabled", v); document.documentElement.setAttribute("data-waves-enabled", String(v)); };
export const getStoredGradientEnabled = () => getBool("gradient_enabled", backgroundWallpaper.common?.gradient?.enable?.desktop ?? true);
export const setStoredGradientEnabled = (v: boolean) => { setBool("gradient_enabled", v); document.documentElement.setAttribute("data-gradient-enabled", String(v)); };
export const getStoredBannerTitleEnabled = () => getBool("banner_title_enabled", backgroundWallpaper.common?.homeText?.enable ?? true);
export const setStoredBannerTitleEnabled = (v: boolean) => {
  setBool("banner_title_enabled", v);
  document.documentElement.setAttribute("data-banner-title-enabled", String(v));
  const o = document.querySelector(".banner-home-text-overlay") as HTMLElement | null;
  if (o) v ? o.classList.remove("user-hidden") : o.classList.add("user-hidden");
};
export const getStoredCarouselEnabled = () => getBool("carousel_enabled", backgroundWallpaper.common?.carousel?.enable ?? false);
export const setStoredCarouselEnabled = (v: boolean) => { setBool("carousel_enabled", v); document.documentElement.setAttribute("data-banner-carousel-enabled", String(v)); };

export const getStoredWallpaperMode = (): WALLPAPER_MODE => {
  const s = localStorage.getItem(LK("wallpaper_mode")) as WALLPAPER_MODE | null;
  return s || "fullscreen";
};
export const setStoredWallpaperMode = (v: WALLPAPER_MODE) => {
  localStorage.setItem(LK("wallpaper_mode"), v);
  window.dispatchEvent(new CustomEvent("dw_wallpaper_mode_change", { detail: { mode: v } }));
};

export const getStoredTheme = () => localStorage.getItem(LK("theme")) as "light" | "dark" | "system" | null;
export const setStoredTheme = (v: "light" | "dark" | "system") => {
  localStorage.setItem(LK("theme"), v);
  window.dispatchEvent(new CustomEvent("dw_theme_change", { detail: { theme: v } }));
};

export const getStoredHue = (): number => {
  const s = localStorage.getItem(LK("hue"));
  return s !== null ? Number(s) : 240;
};
export const setStoredHue = (v: number) => {
  localStorage.setItem(LK("hue"), String(v));
  document.querySelector(":root")?.style.setProperty("--hue", String(v));
};

export const getStoredPostLayout = () => localStorage.getItem(LK("post_layout")) || "grid";
export const setStoredPostLayout = (v: string) => localStorage.setItem(LK("post_layout"), v);
export const getStoredCategoryBar = () => getBool("category_bar", true);
export const setStoredCategoryBar = (v: boolean) => setBool("category_bar", v);
export const getStoredShowTags = () => getBool("show_tags", true);
export const setStoredShowTags = (v: boolean) => setBool("show_tags", v);

export interface DraftPost {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  category: string;
  published: string;
  draft: boolean;
}

export function getSyncStatus() {
  return {
    syncing: localStorage.getItem(LK("syncing")) === "1",
    lastSync: localStorage.getItem(LK("last_sync")),
    error: localStorage.getItem(LK("sync_error")) || null,
  };
}
export function setSyncing(on: boolean) { localStorage.setItem(LK("syncing"), on ? "1" : "0"); }
export function setLastSync(ts: string) { localStorage.setItem(LK("last_sync"), ts); }
export function setSyncError(err: string | null) { localStorage.setItem(LK("sync_error"), err || ""); }

export function postToMarkdown(post: DraftPost): string {
  const fm: string[] = [];
  fm.push("title: " + JSON.stringify(post.title));
  if (post.description) fm.push("description: " + JSON.stringify(post.description));
  if (post.published) fm.push("published: " + post.published);
  if (post.category) fm.push("category: " + post.category);
  if (post.tags.length) fm.push("tags: [" + post.tags.map(function(t){return JSON.stringify(t);}).join(", ") + "]");
  fm.push("draft: " + String(post.draft));
  return "---\n" + fm.join("\n") + "\n---\n\n" + post.content;
}

export function extractSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+\$/g, "");
}
