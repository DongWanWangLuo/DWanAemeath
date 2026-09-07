import type { APIRoute } from "astro";
import * as fs from "fs";
import * as path from "path";

export const GET: APIRoute = () => {
  try {
    const configPath = path.resolve("src/data/all-configs.json");
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(data);
      const categoriesPath = path.resolve("src/data/categories.json");
      if (fs.existsSync(categoriesPath)) {
        config.categories = JSON.parse(fs.readFileSync(categoriesPath, "utf-8")).categories || [];
      }
      return new Response(JSON.stringify(config), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
  } catch (e) {}
  return new Response(JSON.stringify({ error: "Config not found" }), { status: 404 });
};
