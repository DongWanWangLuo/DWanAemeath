<script>
import { onMount } from "svelte";
export let token = "";
export let filePath = "";
export let name = "";
let content = "";
let loading = true, error = "", saving = false, toast = "", toastType = "success";
let rawMode = false;


async function loadConfig() {
  if (!token || !filePath) { error = "No token or path"; loading = false; return; }
  loading = true;
  try {
    const res = await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/" + filePath, {
      headers: { Authorization: "Bearer " + token }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    content = atob(data.content);
    
  } catch (e) { error = e.message; } finally { loading = false; }
}

async function saveConfig() {
  if (!token) return;
  saving = true;
  try {
    const res = await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/" + filePath, {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    const sha = data.sha;
    const payload = {
      message: "chore: update " + name,
      content: btoa(content),
      sha: sha,
      branch: "main"
    };
    const saveRes = await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/" + filePath, {
      method: "PUT",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!saveRes.ok) { const ed = await saveRes.json().catch(()=>({})); throw new Error(ed.message||"Save failed"); }
    toast = name + " saved!"; toastType = "success";
  } catch(e) { toast = e.message; toastType = "error"; } finally { saving = false; }
}

onMount(() => { loadConfig(); });
</script>

<div class="card">
  <div class="card-header">
    <h2>{name}</h2>
    <div class="header-actions">
      <button class="btn btn-secondary btn-sm" onclick={()=>rawMode=!rawMode}>{rawMode?"JSON":"Raw"}</button>
      <button class="btn btn-primary btn-sm" onclick={saveConfig} disabled={saving||!token}}>{saving?"Saving...":"Save"}</button>
    </div>
  </div>
  {#if !token}<div class="alert warn">Set GitHub PAT in login page.</div>{/if}
  {#if loading}<div class="empty"><div class="spinner"></div><p>Loading...</p></div>
  {:else if error}<div class="alert err">{error}</div>
  {:else}
    <textarea bind:value={content} class="code-editor" spellcheck="false"></textarea>
  {/if}
</div>

{#if toast}<div class="toast toast-{toastType}">{toast}</div>{/if}

<style>
.card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px}
.card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px}
.card-header h2{font-size:1.125rem;font-weight:600}
.header-actions{display:flex;gap:8px}
.btn{padding:6px 14px;border-radius:8px;font-size:.8125rem;font-weight:500;cursor:pointer;border:none;transition:all .15s}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover:not(:disabled){background:var(--accent2)}
.btn-secondary{background:var(--bg3);color:var(--text2);border:1px solid var(--border)}
.btn-secondary:hover:not(:disabled){background:#475569;color:var(--text)}
.btn-sm{padding:5px 10px;font-size:.75rem}
.code-editor{width:100%;min-height:400px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:12px;font-family:monospace;font-size:.8125rem;outline:none;resize:vertical}
.code-editor:focus{border-color:var(--accent)}
.alert{padding:12px 16px;border-radius:8px;font-size:.875rem;margin-bottom:16px}
.alert.warn{background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);color:#fbbf24}
.alert.err{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171}
.empty{text-align:center;padding:48px;color:var(--text3)}
.spinner{width:24px;height:24px;border:3px solid var(--bg3);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;display:inline-block;margin-bottom:12px}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;top:16px;right:16px;padding:12px 16px;border-radius:10px;font-size:.875rem;z-index:300;animation:slideIn .3s ease}
.toast-success{background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);color:#4ade80}
.toast-error{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
</style>