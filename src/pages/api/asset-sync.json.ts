import type { APIRoute } from "astro";

interface RequestBody {
	token?: string;
	repo?: string;
	path?: string;
	content?: string;
	message?: string;
}

const json = (body: Record<string, unknown>, status = 200): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});

const parseRepo = (repo: string): { owner: string; name: string } | null => {
	const match = repo.trim().match(/^([^/]+)\/([^/]+)$/);
	return match ? { owner: match[1], name: match[2] } : null;
};

const normalizeAssetPath = (value: string): string | null => {
	const path = value.trim().replaceAll("\\", "/").replace(/^\/+/, "");
	if (!path || path.includes("..") || !/^assets\/(images|music)\/[A-Za-z0-9_./-]+$/i.test(path)) return null;
	if (!/\.[A-Za-z0-9]+$/.test(path)) return null;
	return `public/${path}`;
};

export const POST: APIRoute = async ({ request }) => {
	let body: RequestBody;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: "请求体无效" }, 400);
	}
	if (!body.token || !body.repo || !body.path || !body.content) return json({ ok: false, error: "缺少 token、repo、path 或 content" }, 400);
	const repository = parseRepo(body.repo);
	const file = normalizeAssetPath(body.path);
	if (!repository) return json({ ok: false, error: "仓库格式应为 owner/repo" }, 400);
	if (!file) return json({ ok: false, error: "资源路径只能位于 assets/images 或 assets/music 下" }, 400);

	const headers = {
		Authorization: `Bearer ${body.token}`,
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	};
	const endpoint = `https://api.github.com/repos/${repository.owner}/${repository.name}/contents/${file}`;
	try {
		const currentResponse = await fetch(endpoint, { headers });
		const current = currentResponse.ok ? await currentResponse.json() : null;
		const response = await fetch(endpoint, {
			method: "PUT",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({
				message: body.message || `chore: upload asset ${body.path}`,
				content: body.content,
				...(current?.sha ? { sha: current.sha } : {}),
			}),
		});
		if (!response.ok) return json({ ok: false, error: `GitHub API: ${response.status} ${await response.text()}` }, 502);
		const result = await response.json();
		return json({ ok: true, path: body.path, sha: result.content?.sha || null });
	} catch (error) {
		return json({ ok: false, error: String(error) }, 502);
	}
};
