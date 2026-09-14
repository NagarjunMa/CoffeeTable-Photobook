import { request as httpsRequest } from "node:https";

// Keep uploads on HTTP/1.1 after observed HTTP/2 session failures on Node 26.
// TLS certificate verification remains enabled, and credentials stay in headers.
export async function cloudflareRequest(url: string, init: RequestInit = {}): Promise<Response> {
  const request = new Request(url, init);
  const body = request.body ? Buffer.from(await request.arrayBuffer()) : undefined;
  return new Promise((resolve, reject) => {
    const headers = Object.fromEntries(request.headers);
    if (body) headers["content-length"] = String(body.length);
    const client = httpsRequest(url, {
      method: request.method, headers, agent: false,
      signal: init.signal ?? undefined,
    }, (response) => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 8_000_000) { client.destroy(new Error("Cloudflare API response exceeded limit")); return; }
        chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => {
        const responseHeaders = new Headers();
        for (const [key, value] of Object.entries(response.headers)) {
          if (value !== undefined) responseHeaders.set(key, Array.isArray(value) ? value.join(", ") : value);
        }
        resolve(new Response(new Uint8Array(Buffer.concat(chunks)), {
          status: response.statusCode ?? 502, headers: responseHeaders,
        }));
      });
    });
    client.on("error", () => reject(new TypeError("Cloudflare API connection failed")));
    client.end(body);
  });
}
