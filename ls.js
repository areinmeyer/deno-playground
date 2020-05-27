import { walk } from "https://deno.land/std/fs/walk.ts";

import format from "https://deno.land/x/date_fns/format/index.js";
import username from "https://deno.land/x/username/mod.ts";

async function fileOutput(meta) {
  const { name, path } = meta;
  const fileInfo = await Deno.stat(path);
  const { blocks, size, uid, gid, mtime, nlink, mode } = fileInfo;
  const userName = await getUserName(uid);
  const groupName = await getUserGroup(gid);
  const fdate = await formatDate(mtime);
  const permissions = await getPermissions(mode);
  const indicator = meta.isDirectory ? "d" : meta.isSymlink ? "l" : "-";
  return {
    blocks,
    indicator,
    permissions,
    nlink,
    userName,
    groupName,
    size,
    fdate,
    name,
  };
}

async function getPermissions(st_mode) {
  const permissionMap = {
    "7": "rwx",
    "6": "rw-",
    "5": "r-x",
    "4": "r--",
    "3": "-wx",
    "2": "-w-",
    "1": "--x",
    "0": "---",
  };
  const perm = st_mode.toString(8).slice(-3);
  let permissions = "";
  return perm.split("").map((bit) => {
    return permissionMap[bit.toString()];
  }).join("");
}

async function getUserName(id) {
  return await username();
}

async function getUserGroup(id) {
  let group = "";
  try {
    const process = Deno.run({ cmd: ["id", "-gn"], stdout: "piped" });
    group = new TextDecoder().decode(await process.output());
    group = group.trim();
    process.close();
  } catch (e) {
    group = id;
  } finally {
    return group;
  }
}

async function formatDate(date) {
  const month = format(date, "MMM");
  const day = format(date, "d");
  let time = format(date, "HH:mm");
  if (format(Date.now(), "yyyy") > format(date, "yyyy")) {
    time = format(date, "yyyy");
  }
  return `${month} ${day.padStart(2, " ")} ${time.padStart(5, " ")}`;
}

const fullList = [];
for await (const i of walk(Deno.cwd(), { maxDepth: 1 })) {
  if (i.name.startsWith(".") || i.path === Deno.cwd()) continue;
  const file = await fileOutput(i);
  fullList.push(file);
}

const blockSize = fullList.reduce((acc, file) => {
  return acc + file.blocks;
}, 0);

const sortedList = fullList.sort((a, b) => {
  return a.name < b.name ? -1 : 1;
});

console.log(`total ${blockSize}`);
sortedList.map((file) => {
  console.log(
    `${file.indicator}${file.permissions}  ${
      file.nlink?.toString().padStart(2, " ")
    } ${file.userName}  ${file.groupName} ${
      file.size.toString().padStart(5, " ")
    } ${file.fdate} ${file.name}`,
  );
});
