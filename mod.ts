import { walk } from "https://deno.land/std@0.117.0/fs/mod.ts";
import { relative } from "https://deno.land/std@0.117.0/path/mod.ts";

type TSConfig = {
  compilerOptions: { baseUrl: string; paths: Record<string, string[]> };
};

const config: TSConfig = JSON.parse(Deno.readTextFileSync("./tsconfig.json"));
// console.log({ config });

const pathMap: Map<string, string> = new Map();

for (const path in config.compilerOptions.paths) {
  if (
    Object.prototype.hasOwnProperty.call(config.compilerOptions.paths, path)
  ) {
    pathMap.set(
      path.replace("*", ""),
      config.compilerOptions.paths[path][0].replace("*", "").replace("./", ""),
    );
  }
}

// console.log(Array.from(pathMap.entries()));
console.time("replacing");
console.log("\n");
function getDotDot(path: string, pathMap: string) {
  const currentFolder = path.split("/").slice(0, -1).join("/");
  let result = relative(currentFolder, pathMap);

  if (!result.startsWith(".")) {
    result = "./" + result;
  }
  if (!result.endsWith("/")) {
    result = result + "/";
  }

  return result;
}

// console.log(getDotDot("src/js/app/factory/sys.ts", ["app/", "src/js/app/"]));
for await (const entry of walk("./src")) {
  if (
    entry.isFile && (entry.name.endsWith(".ts") || entry.name.endsWith(".vue"))
  ) {
    let text = Deno.readTextFileSync(entry.path);
    for (const [from, to] of pathMap.entries()) {
      if (text.includes(`from "${from}`)) {
        text = text.replaceAll(
          `from "${from}`,
          `from "${getDotDot(entry.path, to)}`,
        );
      }
    }
    Deno.writeTextFileSync(entry.path, text);
  }
}
console.timeLog("replacing");
console.log("\n");
