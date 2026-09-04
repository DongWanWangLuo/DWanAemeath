export function syncVditorTheme(root: HTMLElement): void {
const dark = document.documentElement.classList.contains("dark");
document.documentElement.classList.toggle("vditor--dark", dark);
root.classList.toggle("vditor--dark", dark);
}
export function observeVditorTheme(root: HTMLElement): MutationObserver {
const mo = new MutationObserver(() => syncVditorTheme(root));
mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
return mo;
}