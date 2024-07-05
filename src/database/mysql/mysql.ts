import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import chalk from "chalk";

export async function createBackup(
  dbConfig: any,
  backupPath: string
): Promise<void> {
  console.log(
    chalk.blue(`Creating backup of ${dbConfig.database} database...`)
  );
  const dumpFileName: string = `${Math.round(Date.now() / 1000)}.dump.sql`;

  const outputPath: string = path.resolve(backupPath, dumpFileName);

  const wstream: fs.WriteStream = fs.createWriteStream(outputPath);

  const mysqldump: any = spawn("mysqldump", [
    `--host=${dbConfig.host}`,
    `--port=${dbConfig.port}`,
    `--user=${dbConfig.user}`,
    `--password=${dbConfig.password}`,
    `--databases`,
    `${dbConfig.database}`,
  ]);

  mysqldump.stdout
    .pipe(wstream)
    .on("finish", function () {
      console.log(
        chalk.green(
          `Backup of ${dbConfig.database} database created at ${outputPath}`
        )
      );
    })
    .on("error", function (err: any) {
      console.error(err);
    });
}
