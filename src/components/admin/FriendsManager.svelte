<script>
import { onMount } from "svelte";
export let token = "";
let friends = [];
let loading = true, error = "";
let modalOpen = false, editing = null;
let saving = false, toast = "", toastType = "success";
let formTitle="", formDesc="", formImgurl="", formSiteurl="", formTags="", formWeight="100", formEnabled=true;

async function loadFriends() {
  if (!token) { error="No token"; loading=false; return; }
  loading=true;
  try {
    const res=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/src/config/friendsConfig.ts", {
      headers:{Authorization:"Bearer "+token}
    });
    if(!res.ok)throw new Error("HTTP "+res.status);
    const data=await res.json();
    const content=atob(data.content);
    // Extract friends array from the TypeScript file
    const match=content.match(/export const friendsConfig:\s*FriendLink\[\]\s*=\s*([\s\S]*?);\s*\/\/\s*getEnabledFriends/);
    if(match){
      try{friends=eval("(" + match[1] + ")");}catch(e){friends=[];}
    } else {
      // Try simpler extraction
      const simpleMatch=content.match(/friendsConfig:\s*([\s\S]*?)\n\n\/\/\s*getEnabledFriends/);
      if(simpleMatch){
        try{friends=eval("(" + simpleMatch[1] + ")");}catch(e){friends=[];}
      }
    }
  } catch(e) { error=e.message; } finally { loading=false; }
}

function openEdit(friend){
  editing=friend;
  formTitle=friend.title||"";formDesc=friend.desc||"";formImgurl=friend.imgurl||"";
  formSiteurl=friend.siteurl||"";formTags=friend.tags?friend.tags.join(", "):"";
  formWeight=String(friend.weight||100);formEnabled=friend.enabled!==false;
  modalOpen=true;
}

function openCreate(){
  editing=null;formTitle="";formDesc="";formImgurl="";formSiteurl="";
  formTags="";formWeight="100";formEnabled=true;modalOpen=true;
}

async function saveFriend(){
  if(!token)return;saving=true;
  try{
    const res=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/src/config/friendsConfig.ts", {
      headers:{Authorization:"Bearer "+token}
    });
    const data=await res.json();
    const sha=data.sha;
    let content=atob(data.content);
    // Replace the friends array
    const newFriend={title:formTitle,desc:formDesc,imgurl:formImgurl,siteurl:formSiteurl,tags:formTags.split(",").map(t=>t.trim()).filter(Boolean),weight:parseInt(formWeight)||100,enabled:formEnabled};
    if(editing){
      const idx=friends.findIndex(f=>f.title===editing.title);
      if(idx>-1)friends[idx]=newFriend;
    } else {
      friends.push(newFriend);
    }
    const newContent=content.replace(/(export const friendsConfig[^[]*\[)([\s\S]*?)(\];)/,$1);
    const payload={message:"chore: update friends config",content:btoa(newContent),sha,branch:"main"};
    const saveRes=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/src/config/friendsConfig.ts", {
      method:"PUT",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(payload)
    });
    if(!saveRes.ok){const ed=await saveRes.json().catch(()=>({}));throw new Error(ed.message||"Save failed");}
    toast="Saved!";toastType="success";modalOpen=false;loadFriends();
  }catch(e){toast=e.message;toastType="error";}finally{saving=false;}
}

async function deleteFriend(friend){
  if(!token||!confirm("Delete "+friend.title+"?"))return;
  friends=friends.filter(f=>f.title!==friend.title);
  try{
    const res=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/src/config/friendsConfig.ts",{headers:{Authorization:"Bearer "+token}});
    const data=await res.json();
    let content=atob(data.content);
    const newContent=content.replace(/(export const friendsConfig[^[]*\[)([\s\S]*?)(\];)/,$1);
    const saveRes=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/src/config/friendsConfig.ts",{
      method:"PUT",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
      body:JSON.stringify({message:"chore: remove friend "+friend.title,content:btoa(newContent),sha:data.sha,branch:"main"})
    });
    if(!saveRes.ok)throw new Error("Delete failed");
    toast="Deleted!";toastType="success";loadFriends();
  }catch(e){toast=e.message;toastType="error";}
}

const fallbackImg='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23334155%22 width=%2248%22 height=%2248%22/%3E%3Ctext x=%2224%22 y=%2228%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2216%22%3E?%3C/text%3E%3C/svg%3E';
onMount(()=>{loadFriends();});
</script>

<div class="page-header">
  <div><h2>Friends</h2><p class="sub">Manage friend links</p></div>
  <button class="btn btn-primary" onclick={openCreate} disabled={!token}>+ Add Friend</button>
</div>
{#if !token}<div class="alert warn">Set GitHub PAT in login page.</div>{/if}
{#if loading}<div class="empty"><div class="spinner"></div><p>Loading...</p></div>
{:else if error}<div class="alert err">{error}</div>
{:else}
  <div class="grid">
    {#each friends as friend (friend.title)}
      <div class="friend-card">
        <div class="friend-avatar"><img src={friend.imgurl} alt={friend.title} onerror={(e)=>{e.target.src='%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2248%22%20height%3D%2248%22%3E%3Crect%20fill%3D%22%23334155%22%20width%3D%2248%22%20height%3D%2248%22%2F%3E%3Ctext%20x%3D%2224%22%20y%3D%2228%22%20text-anchor%3D%22middle%22%20fill%3D%22%2394a3b8%22%20font-size%3D%2216%22%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E'}}/></div>
        <div class="friend-info">
          <div class="friend-title">{friend.title}</div>
          <div class="friend-desc">{friend.desc}</div>
          {#if friend.tags}
            <div class="friend-tags">{#each friend.tags as tag}<span class="tag">{tag}</span>{/each}</div>
          {/if}
        </div>
        <div class="friend-actions">
          <button class="btn btn-sm btn-secondary" onclick={()=>openEdit(friend)}>Edit</button>
          <button class="btn btn-sm btn-danger" onclick={()=>deleteFriend(friend)}>Del</button>
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if modalOpen}
  <div class="modal-overlay" onclick={(e)=>{if(e.target===e.currentTarget)modalOpen=false;}}>
    <div class="modal">
      <div class="modal-header"><h3>{editing?"Edit Friend":"Add Friend"}</h3><button class="modal-close" onclick={()=>modalOpen=false}>×</button></div>
      <div class="modal-body">
        <div class="form-field"><label>Title</label><input bind:value={formTitle}/></div>
        <div class="form-field"><label>Description</label><textarea bind:value={formDesc} rows="2"></textarea></div>
        <div class="form-row">
          <div class="form-field"><label>Avatar URL</label><input bind:value={formImgurl}/></div>
          <div class="form-field"><label>Site URL</label><input bind:value={formSiteurl}/></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label>Tags (comma sep)</label><input bind:value={formTags}/></div>
          <div class="form-field"><label>Weight</label><input type="number" bind:value={formWeight}/></div>
        </div>
        <div class="form-field"><label class="toggle"><input type="checkbox" class="toggle-input" bind:checked={formEnabled}/><span class="toggle-track"></span><span class="toggle-label">Enabled</span></label></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={()=>modalOpen=false}>Cancel</button>
        <button class="btn btn-primary" onclick={saveFriend} disabled={saving||!formTitle}}>{saving?"Saving...":"Save"}</button>
      </div>
    </div>
  </div>
{/if}
{#if toast}<div class="toast toast-{toastType}">{toast}</div>{/if}

<style>
.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
.page-header h2{font-size:1.25rem;font-weight:700}.sub{font-size:.875rem;color:var(--text3);margin-top:2px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;border:none;transition:all .15s}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-primary{background:var(--accent);color:#fff}.btn-primary:hover:not(:disabled){background:var(--accent2)}
.btn-secondary{background:var(--bg3);color:var(--text2);border:1px solid var(--border)}.btn-secondary:hover:not(:disabled){background:#475569;color:var(--text)}
.btn-danger{background:rgba(239,68,68,.15);color:var(--danger);border:1px solid rgba(239,68,68,.3)}.btn-danger:hover:not(:disabled){background:rgba(239,68,68,.25)}
.btn-sm{padding:5px 10px;font-size:.8125rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.friend-card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;gap:14px;align-items:flex-start}
.friend-avatar{width:48px;height:48px;border-radius:8px;overflow:hidden;flex-shrink:0;background:var(--bg3)}
.friend-avatar img{width:100%;height:100%;object-fit:cover}
.friend-info{flex:1;min-width:0}
.friend-title{font-size:.9375rem;font-weight:600;color:var(--text);margin-bottom:4px}
.friend-desc{font-size:.8125rem;color:var(--text2);margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.friend-tags{display:flex;flex-wrap:wrap;gap:4px}
.tag{display:inline-block;padding:2px 8px;background:var(--bg3);border-radius:4px;font-size:.75rem;color:var(--text3)}
.friend-actions{display:flex;gap:6px;flex-shrink:0}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.form-field{margin-bottom:16px}
.form-field label{display:block;font-size:.8125rem;font-weight:500;color:var(--text2);margin-bottom:6px}
.form-field input,.form-field textarea{width:100%;padding:9px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:.875rem;outline:none}
.form-field input:focus,.form-field textarea:focus{border-color:var(--accent)}
.toggle{display:flex;align-items:center;gap:8px;cursor:pointer}
.toggle-input{display:none}
.toggle-track{width:40px;height:22px;background:var(--bg3);border-radius:11px;position:relative;transition:background .2s;flex-shrink:0}
.toggle-track::after{content:"";width:16px;height:16px;background:#fff;border-radius:50%;position:absolute;top:3px;left:3px;transition:transform .2s}
.toggle-input:checked+.toggle-track{background:var(--accent)}
.toggle-input:checked+.toggle-track::after{transform:translateX(18px)}
.toggle-label{font-size:.875rem;color:var(--text2)}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:200}
.modal{background:var(--bg2);border:1px solid var(--border);border-radius:16px;width:90%;max-width:560px;max-height:85vh;display:flex;flex-direction:column}
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
@media(max-width:640px){.form-row{grid-template-columns:1fr}}
</style>