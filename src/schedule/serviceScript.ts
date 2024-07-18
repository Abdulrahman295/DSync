import { createBackup } from "../database/mysql/mysql.js";
import Queue from "bull";
async function processBackupJob(job: any) {
  const { dbConfig, output, zip, encrypt } = job.data;
  createBackup(dbConfig, output, zip, encrypt);
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
