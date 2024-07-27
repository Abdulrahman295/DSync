import fs from "fs";
import Queue from "bull";
import { createBackup } from "../database/backup.js";
import { uploadToDrive } from "../cloud/gDrive/gDrive.js";
import logger from "../utils/logger.js";
import { sendReport } from "../mail/mail.js";

async function processBackupJob(job: any) {
  const { dbConfig, type, output, zip, encrypt, upload, key, parent } =
    job.data;

  const startTime: Date = new Date();

  try {
    const backupFilePath: string = await createBackup(
      dbConfig,
      type,
      output,
      zip,
      encrypt
    );

    const fileSize: number = fs.statSync(backupFilePath).size;

    if (upload) {
      if (!key || !parent) {
        throw new Error("Missing key or parent ID for Google Drive upload");
      }

      await uploadToDrive(backupFilePath, key, parent);
    }

    const endTime: Date = new Date();

    const duration: number = endTime.getTime() - startTime.getTime();

    logger.info({
      id: job.id,
      type: "backup",
      database: dbConfig.database,
      status: "success",
      timestamp: new Date(),
      duration: `${duration}ms`,
      size: `${fileSize} bytes`,
      compressed: zip ? "yes" : "no",
      encrypted: encrypt ? "yes" : "no",
      uploaded: upload ? "yes" : "no",
    });
  } catch (error: any) {
    logger.error({
      id: job.id,
      type: "backup",
      database: dbConfig.database,
      status: "fail",
      timestamp: new Date(),
      error: error.message,
      stack: error.stack,
    });
  }
}

async function processMailJob(job: any) {
  const { recipientMail } = job.data;

  try {
    await sendReport(recipientMail);

    logger.info({
      id: job.id,
      type: "mail",
      message: `Daily report sent successfully to ${recipientMail}`,
      timestamp: new Date(),
    });
  } catch (error: any) {
    logger.error({
      id: job.id,
      type: "mail",
      message: `Failed to send daily report : ${error.message}`,
      timestamp: new Date(),
    });
  }
}

function startScheduler(): void {
  const jobQueue: any = new Queue("jobQueue", {
    redis: {
      host: "127.0.0.1",
      port: 6379,
    },
  });

  jobQueue.process("scheduled-backup", processBackupJob);

  const mailJob: any = jobQueue.getJob("scheduled-mail");

  if (mailJob) {
    jobQueue.process("scheduled-mail", processMailJob);
  }
}

startScheduler();
