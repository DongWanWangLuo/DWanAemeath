<script>
import ConfigEditor from "./ConfigEditor.svelte";
export let token = "";
</script>

<ConfigEditor {token} filePath="src/config/announcementConfig.ts" name="Announcement Config" />

<div class="card">
  <div class="card-title">About</div>
  <p class="text">title, content, closable, link</p>
  <p class="text" style="margin-top:8px;color:var(--text3)">Edit the configuration above and save. Changes are committed directly to the repo.</p>
</div>

<style>
.card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px}
.card-title{font-size:.9375rem;font-weight:600;margin-bottom:12px}
.text{font-size:.875rem;color:var(--text2);line-height:1.6}
</style>