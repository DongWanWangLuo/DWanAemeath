import type { APIRoute } from "astro";
import * as fs from "fs";
import * as path from "path";

export const GET: APIRoute = () => {
  try {
    const configPath = path.resolve("src/data/all-configs.json");
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf-8");
      return new Response(data, {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
  } catch (e) {}
  return new Response(JSON.stringify({ error: "Config not found" }), { status: 404 });
};
