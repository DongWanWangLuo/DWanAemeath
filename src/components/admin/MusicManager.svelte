<script>
import { onMount } from "svelte";
export let token = "";
let mode = "local", playlist = [], toast = "", toastType = "success";
let loading = true, error = "";
let modalOpen = false;
let formTitle="", formArtist="", formUrl="", formLrc="";

async function loadMusic() {
  if(!token){error="No token";loading=false;return;}
  loading=true;
  try{
    const res=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/src/config/musicConfig.ts",{headers:{Authorization:"Bearer "+token}});
    if(!res.ok)throw new Error("HTTP "+res.status);
    const data=await res.json();
    const content=atob(data.content);
    const m=content.match(/local:\s*\{\s*playlist:\s*\[([\s\S]*?)\s*\]/);
    if(m){try{playlist=eval("(" + m[1] + ")");}catch(e){playlist=[];}}
    const modeM=content.match(/mode:\s*"([^"]+)"/);
    if(modeM)mode=modeM[1];
  }catch(e){error=e.message;}finally{loading=false;}
}

function openAdd(){formTitle="";formArtist="";formUrl="";formLrc="";modalOpen=true;}

async function saveMusic(){
  if(!token)return;
  try{
    const res=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/src/config/musicConfig.ts",{headers:{Authorization:"Bearer "+token}});
    const data=await res.json();
    let content=atob(data.content);
    const newPlaylist=playlist.map(p=>({name:p.name,artist:p.artist,url:p.url,cover:p.cover,lrc:p.lrc}));
    const replacer = 'local: { playlist: ' + JSON.stringify(newPlaylist, null, 2) + ' }';
    content = content.replace(/local:\s*\{\s*playlist:\s*\[[\s\S]*?\s*\]/, replacer);
    const saveRes=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/src/config/musicConfig.ts",{
      method:"PUT",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
      body:JSON.stringify({message:"chore: update music playlist",content:btoa(content),sha:data.sha,branch:"main"})
    });
    if(!saveRes.ok)throw new Error("Save failed");
    toast="Music saved!";toastType="success";modalOpen=false;loadMusic();
  }catch(e){toast=e.message;toastType="error";}
}

onMount(()=>{loadMusic();});
</script>

<div class="card">
  <div class="card-header"><h2>Music Player</h2><button class="btn btn-primary btn-sm" onclick={openAdd} disabled={!token}>+ Add Song</button></div>
  {#if !token}<div class="alert warn">Set GitHub PAT to manage music.</div>{/if}
  {#if loading}<div class="empty"><div class="spinner"></div></div>
  {:else if error}<div class="alert err">{error}</div>
  {:else if playlist.length===0}<div class="empty"><p>No songs yet</p></div>
  {:else}
    <div class="list">
      {#each playlist as song, i (i)}
        <div class="song-item">
          <div class="song-info">
            <div class="song-name">{song.name}</div>
            <div class="song-artist">{song.artist}</div>
          </div>
          <div class="song-url" title={song.url}>{song.url.length>40?song.url.slice(0,40)+"...":song.url}</div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if modalOpen}
  <div class="modal-overlay" onclick={(e)=>{if(e.target===e.currentTarget)modalOpen=false;}}>
    <div class="modal">
      <div class="modal-header"><h3>Add Song</h3><button class="modal-close" onclick={()=>modalOpen=false}>×</button></div>
      <div class="modal-body">
        <div class="form-field"><label>Song Name</label><input bind:value={formTitle}/></div>
        <div class="form-field"><label>Artist</label><input bind:value={formArtist}/></div>
        <div class="form-field"><label>Audio URL</label><input bind:value={formUrl}/></div>
        <div class="form-field"><label>LRC URL (optional)</label><input bind:value={formLrc}/></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={()=>modalOpen=false}>Cancel</button>
        <button class="btn btn-primary" onclick={()=>{playlist.push({name:formTitle,artist:formArtist,url:formUrl,lrc:formLrc});modalOpen=false;}} disabled={!formTitle}>Add</button>
      </div>
    </div>
  </div>
{/if}
{#if toast}<div class="toast toast-{toastType}">{toast}</div>{/if}

<style>
.card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px}
.card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px}
.card-header h2{font-size:1.125rem;font-weight:600}
.btn{padding:6px 14px;border-radius:8px;font-size:.8125rem;font-weight:500;cursor:pointer;border:none;transition:all .15s}
.btn-primary{background:var(--accent);color:#fff}.btn-primary:hover:not(:disabled){background:var(--accent2)}
.btn-secondary{background:var(--bg3);color:var(--text2);border:1px solid var(--border)}.btn-secondary:hover:not(:disabled){background:#475569}
.btn-sm{padding:5px 10px;font-size:.75rem}
.list{display:flex;flex-direction:column;gap:8px}
.song-item{display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--border)}
.song-info{flex:1;min-width:0}
.song-name{font-size:.9375rem;font-weight:500;color:var(--text)}
.song-artist{font-size:.8125rem;color:var(--text2)}
.song-url{font-size:.75rem;color:var(--text3);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.form-field{margin-bottom:16px}
.form-field label{display:block;font-size:.8125rem;font-weight:500;color:var(--text2);margin-bottom:6px}
.form-field input{width:100%;padding:9px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:.875rem;outline:none}
.form-field input:focus{border-color:var(--accent)}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:200}
.modal{background:var(--bg2);border:1px solid var(--border);border-radius:16px;width:90%;max-width:480px;display:flex;flex-direction:column}
.modal-header{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.modal-header h3{font-size:1rem;font-weight:600}
.modal-close{background:none;border:none;color:var(--text3);font-size:1.5rem;cursor:pointer}
.modal-body{padding:20px;overflow-y:auto;flex:1}
.modal-footer{padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px}
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