import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const types = {
    html: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "text/javascript; charset=utf-8",
    jpg: "image/jpeg",
    jpeg: "image/jpeg"
};

createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    let path = url.pathname;
    if (path === "/") path = "/index.html";
    if (/^\/p\/[\w-]+\/?$/.test(path)) path = "/profile.html";
    const match = path.match(/^\/(?:images\/)?[\w-]+\.(html|css|js|jpe?g)$/);
    if (!match) {
        response.writeHead(404).end("Not found");
        return;
    }
    try {
        const content = await readFile(new URL("." + path, import.meta.url));
        response.writeHead(200, { "Content-Type": types[match[1]] }).end(content);
    } catch {
        response.writeHead(404).end("Not found");
    }
}).listen(process.env.TAPIN_PORT || 4173, "127.0.0.1", () => {
    console.log("TapIN: http://localhost:" + (process.env.TAPIN_PORT || 4173));
});


