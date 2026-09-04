<script>
import { onMount } from "svelte";
export let token = "";
let posts=[],loading=true,error="",modalOpen=false,editing=null;
let saving=false,toast="",toastType="success";
let formTitle="",formSlug="",formPublished="",formDescription="";
let formTags="",formCategory="",formDraft=false,formPinned=false,formBody="";

async function loadPosts(){
  if(!token){error="No GitHub token";loading=false;return;}
  loading=true;
  try{
    const res=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/src/content/posts",{headers:{Authorization:"Bearer "+token}});
    if(!res.ok)throw new Error("HTTP "+res.status);
    const data=await res.json();
    posts=data.filter(p=>p.type==="dir").map(d=>({name:d.name,slug:d.name,path:"src/content/posts/"+d.name+"/index.md"}));
    await Promise.all(posts.map(async post=>{
      try{const fr=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/"+post.path,{headers:{Authorization:"Bearer "+token}});
        if(fr.ok){const fd=await fr.json();Object.assign(post,parseFM(atob(fd.content)));}
      }catch(e){}
    }));
  }catch(e){error=e.message;}finally{loading=false;}
}

function parseFM(text) {
  const m = text.match(/^---\\n([\\s\\S]+?)\\n---\\n?/);
  if (!m) return {};
  const fm = {};
  m[1].split("\\n").forEach(line => {
    const idx = line.indexOf(":");
    if (idx > -1) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (val.length >= 2 && val[0] === val[val.length - 1]) {
        if (val[0] === '"' || val[0] === "'") val = val.slice(1, -1);
      }
      if (val.startsWith("[") && val.endsWith("]")) {
        try { fm[key] = JSON.parse(val); } catch { fm[key] = val; }
      } else { fm[key] = val; }
    }
  });
  return fm;
}

function openCreate(){
  editing=null;formTitle="";formSlug="";formPublished=new Date().toISOString().slice(0,10);
  formDescription="";formTags="";formCategory="";formDraft=false;formPinned=false;formBody="";modalOpen=true;
}

function openEdit(post){
  editing=post;formTitle=post.title||"";formSlug=post.slug||post.name;
  formPublished=post.published||"";formDescription=post.description||"";
  formTags=Array.isArray(post.tags)?post.tags.join(", "):(post.tags||"");
  formCategory=post.category||"";formDraft=post.draft===true;formPinned=post.pinned===true;
  formBody=post.body||"";modalOpen=true;
}

async function savePost(){
  if(!token)return;saving=true;
  try{
    const slug=formSlug||formTitle.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g,"-").slice(0,80);
    const fp="src/content/posts/"+slug+"/index.md";
    const esc=s=>s.replace(/"/g,"\\\"");
    const fm=["---",
      "title: \""+esc(formTitle)+"\"",
      "published: \""+formPublished+"\"",
      formDescription?"description: \""+esc(formDescription)+"\"":"",
      formTags?"tags: ["+formTags.split(",").map(t=>"\""+t.trim()+"\"").join(", ")+"]":"",
      formCategory?"category: \""+formCategory+"\"":"",
      "draft: "+formDraft,
      "pinned: "+formPinned,
      "---",
      formBody
    ].filter(Boolean).join("\n");
    let sha=null;
    try{const cr=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/"+fp,{headers:{Authorization:"Bearer "+token}});if(cr.ok)sha=(await cr.json()).sha;}catch(e){}
    const payload={message:"chore: "+(editing?"update":"create")+" post",content:btoa(fm),branch:"main"};
    if(sha)payload.sha=sha;
    const res=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/"+fp,{method:"PUT",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!res.ok){const ed=await res.json().catch(()=>({}));throw new Error(ed.message||"HTTP "+res.status);}
    toast=editing?"Post updated!":"Post created!";toastType="success";modalOpen=false;loadPosts();
  }catch(e){toast=e.message;toastType="error";}finally{saving=false;}
}

async function deletePost(post){
  if(!token||!confirm("Delete?"))return;
  try{
    const cr=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/"+post.path,{headers:{Authorization:"Bearer "+token}});
    if(!cr.ok)throw new Error("Failed");const data=await cr.json();
    const dr=await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/"+post.path,{method:"DELETE",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({message:"chore: delete "+post.slug,sha:data.sha,branch:"main"})});
    if(!dr.ok)throw new Error("Delete failed");
    toast="Post deleted!";toastType="success";loadPosts();
  }catch(e){toast=e.message;toastType="error";}
}

onMount(()=>{loadPosts();});
</script><style>
.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
.page-header h2{font-size:1.25rem;font-weight:700}
.sub{font-size:.875rem;color:var(--text3);margin-top:2px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;border:none;transition:all .15s}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover:not(:disabled){background:var(--accent2)}
.btn-secondary{background:var(--bg3);color:var(--text2);border:1px solid var(--border)}
.btn-secondary:hover:not(:disabled){background:#475569;color:var(--text)}
.btn-danger{background:rgba(239,68,68,.15);color:var(--danger);border:1px solid rgba(239,68,68,.3)}
.btn-danger:hover:not(:disabled){background:rgba(239,68,68,.25)}
.btn-sm{padding:5px 10px;font-size:.8125rem}
.table-wrap{overflow-x:auto;background:var(--bg2);border:1px solid var(--border);border-radius:12px}
table{width:100%;border-collapse:collapse}
th,td{padding:10px 14px;text-align:left;border-bottom:1px solid var(--border);font-size:.875rem}
th{color:var(--text3);font-weight:600;font-size:.8125rem;text-transform:uppercase;letter-spacing:.03em}
td{color:var(--text2)}
tr:hover td{background:rgba(255,255,255,.02)}
td.acts{display:flex;gap:6px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.form-field{margin-bottom:16px}
.form-field label{display:block;font-size:.8125rem;font-weight:500;color:var(--text2);margin-bottom:6px}
.form-field input,.form-field textarea,.form-field select{width:100%;padding:9px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:.875rem;outline:none}
.form-field input:focus,.form-field textarea:focus{border-color:var(--accent)}
.toggle{display:flex;align-items:center;gap:8px;cursor:pointer}
.toggle-input{display:none}
.toggle-track{width:40px;height:22px;background:var(--bg3);border-radius:11px;position:relative;transition:background .2s;flex-shrink:0}
.toggle-track::after{content:"";width:16px;height:16px;background:#fff;border-radius:50%;position:absolute;top:3px;left:3px;transition:transform .2s}
.toggle-input:checked+.toggle-track{background:var(--accent)}
.toggle-input:checked+.toggle-track::after{transform:translateX(18px)}
.toggle-label{font-size:.875rem;color:var(--text2)}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:200}
.modal{background:var(--bg2);border:1px solid var(--border);border-radius:16px;width:90%;max-width:720px;max-height:85vh;display:flex;flex-direction:column}
.modal-header{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.modal-header h3{font-size:1rem;font-weight:600}
.modal-close{background:none;border:none;color:var(--text3);font-size:1.5rem;cursor:pointer}
.modal-close:hover{color:var(--text)}
.modal-body{padding:20px;overflow-y:auto;flex:1}
.modal-footer{padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px}
.alert{padding:12px 16px;border-radius:8px;font-size:.875rem;margin-bottom:16px}
.alert.warn{background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);color:#fbbf24}
.alert.err{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171}
.empty{text-align:center;padding:48px 20px;color:var(--text3)}
.spinner{width:24px;height:24px;border:3px solid var(--bg3);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;display:inline-block;margin-bottom:12px}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;top:16px;right:16px;padding:12px 16px;border-radius:10px;font-size:.875rem;z-index:300;animation:slideIn .3s ease}
.toast-success{background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);color:#4ade80}
.toast-error{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@media(max-width:640px){.form-row{grid-template-columns:1fr}}
</style><div class="page-header">
  <div><h2>Posts</h2><p class="sub">Manage blog articles</p></div>
  <button class="btn btn-primary" onclick={openCreate} disabled={!token}}>+ New Post</button>
</div>
{#if !token}
  <div class="alert warn">Set GitHub PAT in login to manage posts.</div>
{/if}
{#if loading}
  <div class="empty"><div class="spinner"></div><p>Loading...</p></div>
{:else if error}
  <div class="alert err">{error}</div>
{:else if posts.length===0}
  <div class="empty"><div class="icon">📝</div><p>No posts found</p></div>
{:else}
  <div class="table-wrap"><table>
    <thead><tr><th>Title</th><th>Category</th><th>Published</th><th>Draft</th><th>Pinned</th><th>Actions</th></tr></thead>
    <tbody>
      {#each posts as post (post.slug)}
        <tr>
          <td><strong>{post.title||post.slug}</strong></td>
          <td>{post.category||"--"}</td>
          <td>{post.published||"--"}</td>
          <td>{post.draft?"📄":"✅"}</td>
          <td>{post.pinned?"📌":"--"}</td>
          <td class="acts">
            <button class="btn btn-sm btn-secondary" onclick={()=>openEdit(post)}>Edit</button>
            <button class="btn btn-sm btn-danger" onclick={()=>deletePost(post)}>Del</button>
          </td>
        </tr>
      {/each}
    </tbody></table></div>
{/if}

{#if modalOpen}
  <div class="modal-overlay" onclick={(e)=>{if(e.target===e.currentTarget)modalOpen=false;}}>
    <div class="modal">
      <div class="modal-header"><h3>{editing?"Edit Post":"New Post"}</h3><button class="modal-close" onclick={()=>modalOpen=false}>×</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-field"><label>Title</label><input bind:value={formTitle} placeholder="Post title"/></div>
          <div class="form-field"><label>Slug</label><input bind:value={formSlug} placeholder="auto-generated"/></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label>Published Date</label><input type="date" bind:value={formPublished}/></div>
          <div class="form-field"><label>Category</label><input bind:value={formCategory} placeholder="e.g. 技术, 随笔"/></div>
        </div>
        <div class="form-field"><label>Description</label><textarea bind:value={formDescription} rows="2"></textarea></div>
        <div class="form-field"><label>Tags (comma separated)</label><input bind:value={formTags} placeholder="Astro, 博客"/></div>
        <div class="form-row">
          <div class="form-field"><label class="toggle"><input type="checkbox" class="toggle-input" bind:checked={formDraft}/><span class="toggle-track"></span><span class="toggle-label">Draft</span></label></div>
          <div class="form-field"><label class="toggle"><input type="checkbox" class="toggle-input" bind:checked={formPinned}/><span class="toggle-track"></span><span class="toggle-label">Pinned</span></label></div>
        </div>
        <div class="form-field"><label>Content (Markdown)</label><textarea bind:value={formBody} rows="12" style="font-family:monospace;font-size:.8125rem"></textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={()=>modalOpen=false}>Cancel</button>
        <button class="btn btn-primary" onclick={savePost} disabled={saving||!formTitle}}>{saving?"Saving...":"Save"}</button>
      </div>
    </div>
  </div>
{/if}

{#if toast}<div class="toast toast-{toastType}">{toast}</div>{/if}