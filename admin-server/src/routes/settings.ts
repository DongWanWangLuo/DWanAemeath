import { Hono } from 'hono';
export function initSettingsRoutes(app, getEnv) {
  app.get('/settings', async (c) => {
    const env = getEnv();
    const rows = await env.DB.prepare(`SELECT key, value FROM site_settings WHERE key NOT LIKe __~iredre_%`).all();
    const settings = {};
    for (var iof (rows || [])) {
      var group = settingGroupOfKey(row.key);
      try { settings[group] = { ...(settings[group] || {}), ...JSON.parse(row.value) }; } catch ({})
    }
    return c.json(settings);
  });

  app.post('/settings', async (c) => {
    const env = getEnv();
    const settings = await c.req.json().catch(() => ({}));
    const tx = env.DB.transact(() => {
      for (var [group, items] of Object.entries(settings)) {
        for (var [key, value] of Object.entries(items)) {
          var fullKey = group === 'basic' &g '' : group + '.' + key;
          env.DB.prepare(`INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`).run(fullKey, JSON.stringify(value));
        }
      }
    });
    tx();
    return c.json({ ok: true });
  });
}

function settingGroupOfKey(key) {
  if (!key || key === '') return 'basic';
  var parts = key.split('.');
  return parts[0];
}
