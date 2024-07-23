import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { pipeline } from "stream/promises";
import chalk from "chalk";
import { addGzipCompressor, addGzipDecompressor } from "../../gzip/gzip.js";
import {
  addEncryptionCipher,
  addDecryptionCipher,
} from "../../encryption/encryption.js";

import {
  isEncrypted,
  isCompressed,
  getFileName,
  evaluateExtension,
} from "../../utils/file.js";

export async function createBackup(
  dbConfig: any,
  backupDirectoryPath: string,
  compressEnabled: boolean,
  encryptEnabled: boolean
): Promise<string> {
  console.log(chalk.blue(`Creating backup of ${dbConfig.database} database`));

  const mysqldump: any = spawn("mysqldump", [
    `--host=${dbConfig.host}`,
    `--port=${dbConfig.port}`,
    `--user=${dbConfig.user}`,
    `--password=${dbConfig.password}`,
    `--databases`,
    `${dbConfig.database}`,
  ]);

  let pipelineStages: any[] = [mysqldump.stdout];

  if (compressEnabled) addGzipCompressor(pipelineStages);

  if (encryptEnabled) addEncryptionCipher(pipelineStages, compressEnabled);

  const dumpFileName: string = `${Math.round(
    Date.now() / 1000
  )}${evaluateExtension(compressEnabled, encryptEnabled)}`;

  let outputPath: string = path.resolve(backupDirectoryPath, dumpFileName);

  const wstream: fs.WriteStream = fs.createWriteStream(outputPath);

  pipelineStages.push(wstream);

  await pipeline(pipelineStages);

  return outputPath;
}

export async function restoreBackup(
  backupFilePath: string,
  outputPath: string,
  directRestore: boolean,
  dbConfig: any
): Promise<void> {
  let inputPath: string = path.resolve(backupFilePath);

  console.log(chalk.blue(`Processing backup file: ${inputPath}`));

  let pipelineStages: any[] = [];

  const fileEncrypted: boolean = await isEncrypted(inputPath);

  const fileCompressed: boolean = await isCompressed(inputPath);

  const rstream: fs.ReadStream = fs.createReadStream(inputPath, {
    start: fileEncrypted ? 24 : 0,
  });

  pipelineStages.push(rstream);

  if (fileEncrypted) await addDecryptionCipher(pipelineStages, inputPath);

  if (fileCompressed) addGzipDecompressor(pipelineStages);

  if (directRestore) {
    const mysql: any = spawn("mysql", [
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--user=${dbConfig.user}`,
      `--password=${dbConfig.password}`,
      `${dbConfig.database}`,
    ]);

    pipelineStages.push(mysql.stdin);
  } else {
    outputPath = path.resolve(outputPath, `${getFileName(inputPath)}.sql`);

    console.log(chalk.blue(`Creating SQL dump at: ${outputPath}`));

    const wstream: fs.WriteStream = fs.createWriteStream(
      outputPath
    ) as fs.WriteStream;

    pipelineStages.push(wstream);
  }

  await pipeline(pipelineStages);
}
