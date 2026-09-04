<script>
import { onMount } from "svelte";
import Sidebar from "./Sidebar.svelte";
import Dashboard from "./Dashboard.svelte";
import PostManager from "./PostManager.svelte";
import ConfigEditor from "./ConfigEditor.svelte";
import ProfileEditor from "./ProfileEditor.svelte";
import FriendsManager from "./FriendsManager.svelte";
import MusicManager from "./MusicManager.svelte";
import AnnouncementEditor from "./AnnouncementEditor.svelte";
import WallpaperEditor from "./WallpaperEditor.svelte";
import SidebarEditor from "./SidebarEditor.svelte";

let page = "dashboard";
let token = "";
let mobileOpen = false;
let loading = true;

export function navigate(p) {
  page = p;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("admin_page", p);
  }
  mobileOpen = false;
}

$: checked = token && token.length > 10;
$: needsToken = !checked;

function checkSession() {
  if (typeof localStorage === "undefined") return false;
  return !!localStorage.getItem("s");
}

function getStoredToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem("tk") || "";
}

onMount(() => {
  if (!checkSession()) {
    window.location.href = "/admin/login/";
    return;
  }
  token = getStoredToken();
  const saved = localStorage.getItem("admin_page");
  if (saved) page = saved;
  loading = false;
});

function doLogout() {
  if (typeof localStorage !== "undefined") localStorage.clear();
  window.location.href = "/admin/login/";
}
</script>