import type { NavMenuItem } from '../types/navMenuConfig';

const STORAGE_KEY = 'dw_nav_config';

export function getNavConfig(): NavMenuItem[] | null {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function setNavConfig(links: NavMenuItem[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(links)); } catch(e) {}
  window.dispatchEvent(new CustomEvent("dw_nav_config_change", { detail: { links } }));
}

export function isNavCustomized(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// Deep clone to avoid mutation
export function cloneLinks(links: NavMenuItem[]): NavMenuItem[] {
  return JSON.parse(JSON.stringify(links));
}

// Generate unique id
export function genId(prefix: string): string {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
}

// Add child to parent
export function addChild(links: NavMenuItem[], parentId: string, child: NavMenuItem): NavMenuItem[] {
  return links.map(function(item) {
    if (item.id === parentId) {
      return Object.assign({}, item, { children: (item.children || []).concat([child]) });
    }
    if (item.children) {
      return Object.assign({}, item, { children: addChild(item.children, parentId, child) });
    }
    return item;
  });
}

// Remove child
export function removeChild(links: NavMenuItem[], parentId: string, childId: string): NavMenuItem[] {
  return links.map(function(item) {
    if (item.id === parentId && item.children) {
      return Object.assign({}, item, { children: item.children.filter(function(c) { return c.id !== childId; }) });
    }
    if (item.children) {
      return Object.assign({}, item, { children: removeChild(item.children, parentId, childId) });
    }
    return item;
  });
}

// Move item up/down in list
export function moveItem(links: NavMenuItem[], fromIndex: number, toIndex: number): NavMenuItem[] {
  var result = links.slice();
  var [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

// Move child within parent
export function moveChild(links: NavMenuItem[], parentId: string, fromIdx: number, toIdx: number): NavMenuItem[] {
  return links.map(function(item) {
    if (item.id === parentId && item.children) {
      var children = item.children.slice();
      var [removed] = children.splice(fromIdx, 1);
      children.splice(toIdx, 0, removed);
      return Object.assign({}, item, { children: children });
    }
    if (item.children) {
      return Object.assign({}, item, { children: moveChild(item.children, parentId, fromIdx, toIdx) });
    }
    return item;
  });
}

// Update item
export function updateItem(links: NavMenuItem[], id: string, updates: Partial<NavMenuItem>): NavMenuItem[] {
  return links.map(function(item) {
    if (item.id === id) return Object.assign({}, item, updates);
    if (item.children) return Object.assign({}, item, { children: updateItem(item.children, id, updates) });
    return item;
  });
}

// Delete item
export function deleteItem(links: NavMenuItem[], id: string): NavMenuItem[] {
  return links.filter(function(item) { return item.id !== id; }).map(function(item) {
    if (item.children) return Object.assign({}, item, { children: deleteItem(item.children, id) });
    return item;
  });
}

// Find item by id (flat search)
export function findItem(links: NavMenuItem[], id: string): NavMenuItem | null {
  for (var i = 0; i < links.length; i++) {
    if (links[i].id === id) return links[i];
    if (links[i].children) {
      var found = findItem(links[i].children, id);
      if (found) return found;
    }
  }
  return null;
}
