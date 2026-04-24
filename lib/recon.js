import { tinyfishBrowse } from "./tinyfish";

export async function runRecon(target) {
  const data = await tinyfishBrowse(target);

  const defaultEndpoints = ["/", "/login", "/api", "/dashboard", "/reset-password"];
  if (!data.endpoints || data.endpoints.length === 0) {
    data.endpoints = defaultEndpoints;
  }

  if (!data.techStack || data.techStack.length === 0) {
    data.techStack = ["Node.js", "Express-like API", "Cloud CDN"];
  }

  return data;
}
