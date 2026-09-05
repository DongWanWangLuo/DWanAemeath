import type { APIRoute } from 'astro';

interface RequestBody {
  token: string;
  repo: string;
  config: Record<string, any>;
}

export const POST: APIRoute = async ({ request }) => {
  let body: RequestBody;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: '请求体无效' }), { status: 400 });
  }

  const { token, repo, config } = body;
  if (!token || !repo) {
    return new Response(JSON.stringify({ ok: false, error: '缺少 token 或 repo' }), { status: 400 });
  }

  try {
    var idx = repo.indexOf('/');
    var owner = idx > 0 ? repo.substring(0, idx) : null;
    var name = idx > 0 ? repo.substring(idx + 1) : null;
    if (!owner || !name) {
      return new Response(JSON.stringify({ ok: false, error: '仓库格式错误' }), { status: 400 });
    }

    var filePath = 'src/data/admin-config.json';
    var content = JSON.stringify(config, null, 2);
    var contentB64 = Buffer.from(content).toString('base64');

    var getFileUrl = 'https://api.github.com/repos/' + owner + '/' + name + '/contents/' + encodeURIComponent(filePath);
    var getFileRes = await fetch(getFileUrl, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json' }
    });

    var sha = '';
    if (getFileRes.ok) {
      var fileData = await getFileRes.json();
      sha = fileData && fileData.sha ? fileData.sha : '';
    }

    var putUrl = 'https://api.github.com/repos/' + owner + '/' + name + '/contents/' + encodeURIComponent(filePath);
    var putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: 'chore: sync admin config from panel',
        content: contentB64,
        ...(sha ? { sha: sha } : {}),
      }),
    });

    if (!putRes.ok) {
      var errText = await putRes.text();
      return new Response(JSON.stringify({ ok: false, error: 'GitHub API: ' + putRes.status + ' - ' + errText }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, message: '同步成功' }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
};
