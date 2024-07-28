import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import chalk from "chalk";
import { addGzipDecompressor } from "../gzip/gzip.js";
import { addDecryptionCipher } from "../encryption/encryption.js";
import { isEncrypted, isCompressed, getFileName } from "../utils/file.js";
import { createMysqlRestoreStream } from "./mysql/mysql.js";
import { createPostgresRestoreStream } from "./postgresql/postgresql.js";
import { createMongoRestoreStream } from "./mongodb/mongodb.js";

export async function restoreBackup(
  backupFilePath: string,
  outputPath: string,
  directRestore: boolean,
  dbConfig: any,
  databaseType: string
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
    const restoreStream: any = createRestoreStream(dbConfig, databaseType);

    pipelineStages.push(restoreStream);
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

function createRestoreStream(dbConfig: any, databaseType: string): any {
  switch (databaseType) {
    case "mysql":
      return createMysqlRestoreStream(dbConfig);
    case "postgresql":
      return createPostgresRestoreStream(dbConfig);
    case "mongodb":
      return createMongoRestoreStream(dbConfig);
    default:
      throw new Error("Unsupported database type");
  }
}
