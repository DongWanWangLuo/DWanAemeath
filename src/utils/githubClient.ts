export type GitHubFileAction = "read" | "write" | "delete";

interface GitHubFileRequest {
	token: string;
	repo: string;
	path: string;
	action: GitHubFileAction;
	content?: string;
	encodedContent?: string;
	message?: string;
}

interface GitHubFileResult {
	ok: boolean;
	content?: string;
	sha?: string | null;
	error?: string;
}

const encodeBase64 = (value: string): string => {
	const bytes = new TextEncoder().encode(value);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
};

const decodeBase64 = (value: string): string => {
	const binary = atob(value.replaceAll("\n", ""));
	return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
};

export async function githubFileRequest(request: GitHubFileRequest): Promise<GitHubFileResult> {
	const match = request.repo.trim().match(/^([^/]+)\/([^/]+)$/);
	if (!match) return { ok: false, error: "仓库格式应为 owner/repo" };
	const encodedPath = request.path.split("/").map((part) => encodeURIComponent(part)).join("/");
	const endpoint = `https://api.github.com/repos/${encodeURIComponent(match[1])}/${encodeURIComponent(match[2])}/contents/${encodedPath}`;
	const headers = {
		Authorization: `Bearer ${request.token}`,
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	};

	try {
		const currentResponse = await fetch(endpoint, { headers });
		const current = currentResponse.ok ? await currentResponse.json() : null;
		if (request.action === "read") {
			if (!current?.content) return { ok: false, error: "文件不存在" };
			return { ok: true, content: decodeBase64(String(current.content)), sha: current.sha };
		}
		if (request.action === "delete") {
			if (!current?.sha) return { ok: false, error: "文件不存在" };
			const response = await fetch(endpoint, { method: "DELETE", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ message: request.message || `chore: delete ${request.path}`, sha: current.sha }) });
			return response.ok ? { ok: true } : { ok: false, error: await githubError(response) };
		}
		if (typeof request.content !== "string" && typeof request.encodedContent !== "string") return { ok: false, error: "文件内容不能为空" };
		const response = await fetch(endpoint, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ message: request.message || `chore: update ${request.path}`, content: request.encodedContent || encodeBase64(request.content || ""), ...(current?.sha ? { sha: current.sha } : {}) }) });
		return response.ok ? { ok: true, sha: (await response.json()).content?.sha || null } : { ok: false, error: await githubError(response) };
	} catch (error) {
		return { ok: false, error: String(error) };
	}
}

async function githubError(response: Response): Promise<string> {
	let detail = "";
	try {
		const body = await response.json();
		if (typeof body?.message === "string") detail = body.message;
	} catch {
		// GitHub may return a non-JSON gateway response.
	}
	if (response.status === 401 || response.status === 403) return `GitHub 权限不足 (${response.status})${detail ? `：${detail}` : "，请确认 Token 的 Contents 权限为 Read and write"}`;
	if (response.status === 404) return `GitHub 文件或仓库不存在 (404)${detail ? `：${detail}` : ""}`;
	return `GitHub API ${response.status}${detail ? `：${detail}` : ""}`;
}
