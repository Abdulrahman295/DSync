import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { pipeline } from "stream/promises";
import chalk from "chalk";
import { createGzipCompressor } from "../../archive/fileArchive.js";
import { createEncryptionCipher } from "../../cipher/cipher.js";

export function createBackup(
  dbConfig: any,
  backupPath: string,
  compressEnabled: boolean,
  encryptEnabled: boolean
) {
  console.log(
    chalk.blue(`Creating backup of ${dbConfig.database} database...`)
  );

  const dumpFileName: string = `${Math.round(Date.now() / 1000)}.dump.sql`;

  let outputPath: string = path.resolve(backupPath, dumpFileName);

  const mysqldump: any = spawn("mysqldump", [
    `--host=${dbConfig.host}`,
    `--port=${dbConfig.port}`,
    `--user=${dbConfig.user}`,
    `--password=${dbConfig.password}`,
    `--databases`,
    `${dbConfig.database}`,
  ]);

  let pipelineStages: any[] = [mysqldump.stdout];

  if (compressEnabled) {
    createGzipCompressor(pipelineStages);
    outputPath += ".gz";
  }

  if (encryptEnabled) {
    createEncryptionCipher(pipelineStages);
    outputPath += ".enc";
  }

  const wstream: fs.WriteStream = fs.createWriteStream(outputPath);
  pipelineStages.push(wstream);

  pipeline(pipelineStages)
    .then(() => {
      console.log(chalk.green(`Backup created successfully at ${outputPath}`));
    })
    .catch((err) => {
      console.error(chalk.red(err));
    });
}
