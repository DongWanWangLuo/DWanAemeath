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
	const endpoint = `https://api.github.com/repos/${match[1]}/${match[2]}/contents/${request.path}`;
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
			return response.ok ? { ok: true } : { ok: false, error: `GitHub API: ${response.status}` };
		}
		if (typeof request.content !== "string" && typeof request.encodedContent !== "string") return { ok: false, error: "文件内容不能为空" };
		const response = await fetch(endpoint, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ message: request.message || `chore: update ${request.path}`, content: request.encodedContent || encodeBase64(request.content || ""), ...(current?.sha ? { sha: current.sha } : {}) }) });
		return response.ok ? { ok: true, sha: (await response.json()).content?.sha || null } : { ok: false, error: `GitHub API: ${response.status}` };
	} catch (error) {
		return { ok: false, error: String(error) };
	}
}
