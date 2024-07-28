import chalk from "chalk";
import path from "path";
import fs from "fs";

export function loadFile(filePath: string): string {
  try {
    const resolvedPath: string = path.resolve(filePath);

    console.log(chalk.blue(`Loading file from ${resolvedPath}`));

    const data: string = fs.readFileSync(resolvedPath, "utf8");

    return data;
  } catch (err) {
    console.error(chalk.red(err));
    process.exit(1);
  }
}

export function evaluateExtension(
  fileCompressed: boolean,
  fileEncrypted: boolean,
  databaseType: string
): string {
  let extension: string = databaseType === "mongodb" ? ".archive" : ".sql";

  if (fileCompressed) {
    extension = ".gz";
  }

  if (fileEncrypted) {
    extension = ".enc";
  }

  return extension;
}

export async function readChunck(
  filePath: string,
  start: number,
  end: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const rstream: fs.ReadStream = fs.createReadStream(filePath, {
      start,
      end,
    });
    const chunks: Buffer[] = [];

    rstream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    rstream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    rstream.on("error", (err) => {
      reject(err);
    });
  });
}

export async function isEncrypted(filePath: string): Promise<boolean> {
  if (filePath.endsWith(".enc")) {
    return true;
  }

  const buffer = await readChunck(filePath, 0, 7);

  return buffer.toString() === "ENC_COMP" || buffer.toString() === "ENC_ONLY";
}

export async function isCompressed(filePath: string): Promise<boolean> {
  if (filePath.endsWith(".gz")) {
    return true;
  }

  const buffer = await readChunck(filePath, 0, 7);

  return buffer.toString() === "ENC_COMP";
}

export function getFileName(filePath: string): string {
  return path.basename(filePath).split(".")[0];
}

export function getFileSize(filePath: string): number {
  return fs.statSync(filePath).size;
}
