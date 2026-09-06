import type { APIRoute } from "astro";

interface RequestBody {
	token?: string;
	repo?: string;
	action?: "read" | "write" | "delete";
	file?: string;
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

const normalizeFile = (file: string): string | null => {
	const normalized = file.trim().replaceAll("\\", "/").replace(/^\/+/, "");
	if (!normalized || normalized.includes("..") || !/^src\/content\/posts\/.+\.(md|mdx)$/i.test(normalized)) {
		return null;
	}
	return normalized;
};

const githubHeaders = (token: string): HeadersInit => ({
	Authorization: `Bearer ${token}`,
	Accept: "application/vnd.github+json",
	"X-GitHub-Api-Version": "2022-11-28",
});

export const POST: APIRoute = async ({ request }) => {
	let body: RequestBody;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: "请求体无效" }, 400);
	}

	if (!body.token || !body.repo || !body.action || !body.file) {
		return json({ ok: false, error: "缺少 token、repo、action 或 file" }, 400);
	}
	const repository = parseRepo(body.repo);
	const file = normalizeFile(body.file);
	if (!repository) return json({ ok: false, error: "仓库格式应为 owner/repo" }, 400);
	if (!file) return json({ ok: false, error: "文章路径必须位于 src/content/posts 下，并使用 .md 或 .mdx" }, 400);

	const endpoint = `https://api.github.com/repos/${repository.owner}/${repository.name}/contents/${file}`;
	try {
		const currentResponse = await fetch(endpoint, { headers: githubHeaders(body.token) });
		const current = currentResponse.ok ? await currentResponse.json() : null;

		if (body.action === "read") {
			if (!current?.content) return json({ ok: false, error: "文章不存在" }, 404);
			const content = Buffer.from(String(current.content).replaceAll("\n", ""), "base64").toString("utf8");
			return json({ ok: true, file, content, sha: current.sha });
		}

		if (body.action === "delete") {
			if (!current?.sha) return json({ ok: false, error: "文章不存在" }, 404);
			const response = await fetch(endpoint, {
				method: "DELETE",
				headers: { ...githubHeaders(body.token), "Content-Type": "application/json" },
				body: JSON.stringify({ message: body.message || `chore: delete post ${file}`, sha: current.sha }),
			});
			if (!response.ok) return json({ ok: false, error: `GitHub API: ${response.status} ${await response.text()}` }, 502);
			return json({ ok: true, file });
		}

		if (typeof body.content !== "string" || !body.content.trim()) {
			return json({ ok: false, error: "文章内容不能为空" }, 400);
		}
		const response = await fetch(endpoint, {
			method: "PUT",
			headers: { ...githubHeaders(body.token), "Content-Type": "application/json" },
			body: JSON.stringify({
				message: body.message || `chore: update post ${file}`,
				content: Buffer.from(body.content, "utf8").toString("base64"),
				...(current?.sha ? { sha: current.sha } : {}),
			}),
		});
		if (!response.ok) return json({ ok: false, error: `GitHub API: ${response.status} ${await response.text()}` }, 502);
		const result = await response.json();
		return json({ ok: true, file, sha: result.content?.sha || null });
	} catch (error) {
		return json({ ok: false, error: String(error) }, 502);
	}
};
