import fs from "fs";
import { Transform } from "stream";
import crypto from "crypto";
import "dotenv/config";
import chalk from "chalk";
import { readChunck } from "../utils/file.js";

export function addEncryptionCipher(
  pipelineStages: any[],
  compressEnabled: boolean
): void {
  console.log(chalk.blue("Creating encryption cipher"));

  if (!process.env.MASTER_KEY) {
    throw new Error("MASTER_KEY is not set in the environment variables");
  }

  const encryptionFlag = Buffer.from(compressEnabled ? "ENC_COMP" : "ENC_ONLY");

  const iv = crypto.randomBytes(16);

  const key = crypto
    .createHash("sha256")
    .update(process.env.MASTER_KEY)
    .digest();

  const cipher = crypto.createCipheriv("aes256", key, iv) as crypto.CipherGCM;

  let appendIv: boolean = true;

  const encryptionStream = new Transform({
    transform(chunk, encoding, callback) {
      if (appendIv) {
        this.push(encryptionFlag);
        this.push(iv);
        appendIv = false;
      }
      this.push(chunk);
      callback();
    },
  });

  pipelineStages.push(cipher);

  pipelineStages.push(encryptionStream);
}

export async function addDecryptionCipher(
  pipelineStages: any[],
  filePath: string
): Promise<void> {
  console.log(chalk.blue("Creating decryption cipher"));

  if (!process.env.MASTER_KEY) {
    throw new Error("MASTER_KEY is not set in the environment variables");
  }

  let iv: Buffer = await readChunck(filePath, 8, 23);

  const key = crypto
    .createHash("sha256")
    .update(process.env.MASTER_KEY)
    .digest();

  const decipher = crypto.createDecipheriv(
    "aes256",
    key,
    iv
  ) as crypto.DecipherGCM;

  pipelineStages.push(decipher);
}
