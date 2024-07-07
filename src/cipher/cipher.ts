import { Transform } from "stream";
import crypto from "crypto";
import "dotenv/config";
import chalk from "chalk";

export function createEncryptionCipher(pipelineStages: any[]): void {
  console.log(chalk.blue("Creating encryption cipher..."));

  if (!process.env.MASTER_KEY) {
    throw new Error("MASTER_KEY is not set in the environment variables");
  }

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
