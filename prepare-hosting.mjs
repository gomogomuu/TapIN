import { cp, mkdir } from "node:fs/promises";

const assets = [
    "index.html", "account.html", "profile.html", "style.css", "script.js",
    "account.js", "profile-editor.js", "firebase-client.js", "firebase-config.js", "images"
];
const output = new URL("./.firebase/site/", import.meta.url);
await mkdir(output, { recursive: true });
await Promise.all(assets.map(asset => cp(
    new URL(asset, import.meta.url), new URL(asset, output), { recursive: asset === "images" }
)));
