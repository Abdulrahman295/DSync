import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import chalk from "chalk";
import { compress } from "../../archive/fileArchive.js";

export async function createBackup(
  dbConfig: any,
  backupPath: string,
  compressEnabled: boolean
): Promise<void> {
  console.log(
    chalk.blue(`Creating backup of ${dbConfig.database} database...`)
  );
  const dumpFileName: string = `${Math.round(Date.now() / 1000)}.dump.sql`;

  const outputPath: string = path.resolve(backupPath, dumpFileName);

  const mysqldump: any = spawn("mysqldump", [
    `--host=${dbConfig.host}`,
    `--port=${dbConfig.port}`,
    `--user=${dbConfig.user}`,
    `--password=${dbConfig.password}`,
    `--databases`,
    `${dbConfig.database}`,
  ]);

  if (compressEnabled) {
    compress(mysqldump.stdout, `${outputPath}.gz`);
  } else {
    const wstream: fs.WriteStream = fs.createWriteStream(outputPath);

    mysqldump.stdout
      .pipe(wstream)
      .on("finish", function () {
        console.log(
          chalk.green(`Backup created successfully at ${outputPath}`)
        );
      })
      .on("error", function (err: any) {
        console.error(err);
      });
  }
}
