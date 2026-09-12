import { cp, mkdir } from "node:fs/promises";
await mkdir("dist/ui", { recursive: true });
await cp("ui/index.html", "dist/ui/index.html");
await cp("ui/styles.css", "dist/ui/styles.css");
