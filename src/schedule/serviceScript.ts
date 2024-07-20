import { createBackup } from "../database/mysql/mysql.js";
import { uploadToDrive } from "../cloud/gDrive/gDrive.js";
import Queue from "bull";

async function processBackupJob(job: any) {
  const { dbConfig, output, zip, encrypt, upload, key, parent } = job.data;

  const backupFilePath = await createBackup(dbConfig, output, zip, encrypt);

  if (upload) {
    await uploadToDrive(backupFilePath, key, parent);
  }
}

async function startScheduler(): Promise<void> {
  const backupQueue: any = new Queue("backupQueue", {
    redis: {
      host: "127.0.0.1",
      port: 6379,
    },
  });

  backupQueue.process("scheduled-backup", processBackupJob);
}

startScheduler();
