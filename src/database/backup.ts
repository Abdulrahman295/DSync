import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import chalk from "chalk";
import { addGzipCompressor } from "../gzip/gzip.js";
import { addEncryptionCipher } from "../encryption/encryption.js";
import { createMysqlDumpStream } from "./mysql/mysql.js";
import { createPostgresDumpStream } from "./postgresql/postgresql.js";
import { createMongoDumpStream } from "./mongodb/mongodb.js";
import { evaluateExtension } from "../utils/file.js";

export async function createBackup(
  dbConfig: any,
  databaseType: string,
  backupDirectoryPath: string,
  compressEnabled: boolean,
  encryptEnabled: boolean
): Promise<string> {
  console.log(chalk.blue(`Creating backup of ${dbConfig.database} database`));

  const dumpStream: any = createDumpStream(dbConfig, databaseType);

  let pipelineStages: any[] = [dumpStream];

  if (compressEnabled) addGzipCompressor(pipelineStages);

  if (encryptEnabled) addEncryptionCipher(pipelineStages, compressEnabled);

  const dumpFileName: string = `${Math.round(
    Date.now() / 1000
  )}${evaluateExtension(compressEnabled, encryptEnabled, databaseType)}`;

  let outputPath: string = path.resolve(backupDirectoryPath, dumpFileName);

  const wstream: fs.WriteStream = fs.createWriteStream(outputPath);

  pipelineStages.push(wstream);

  await pipeline(pipelineStages);

  return outputPath;
}

function createDumpStream(dbConfig: any, databaseType: string): any {
  switch (databaseType) {
    case "mysql":
      return createMysqlDumpStream(dbConfig);
    case "postgresql":
      return createPostgresDumpStream(dbConfig);
    case "mongodb":
      return createMongoDumpStream(dbConfig);
    default:
      throw new Error("Unsupported database type");
  }
}
