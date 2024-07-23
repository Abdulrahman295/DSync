import Queue from "bull";
import { Service } from "node-windows";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

export async function setupScheduler(
  jobData: any,
  interval: string
): Promise<void> {
  console.log(chalk.cyanBright("Setting up scheduler"));

  const jobQueue: any = new Queue("jobQueue", {
    redis: {
      host: "127.0.0.1",
      port: 6379,
    },
  });

  console.log(chalk.cyanBright("Clearing any previous job configurations"));

  await jobQueue.obliterate({ force: true });

  console.log(chalk.cyanBright("Setting up backup job configuration"));

  await jobQueue.add("scheduled-backup", jobData, {
    repeat: { cron: interval },
  });

  if (jobData.mail) {
    console.log(chalk.cyanBright("Setting up mail job configuration"));

    await jobQueue.add(
      "scheduled-mail",
      { recipientMail: jobData.mail },
      {
        repeat: { cron: "0 0 * * *" },
      }
    );
  }
}

export function installSchedulerService(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(chalk.cyanBright("Installing scheduler as a windows service"));

    const __filename = fileURLToPath(import.meta.url);

    const __dirname = path.dirname(__filename);

    const svc: Service = new Service({
      name: "DsyncService",
      description: "Service to run scheduled backups",
      script: path.join(__dirname, "./serviceScript.ts"),
      nodeOptions: ["--loader", "ts-node/esm"],
    });

    svc.install();

    svc.on("install", () => {
      svc.start();
      resolve();
    });

    svc.on("error", (err) => {
      reject(err);
    });
  });
}

function getSchedulerService(): Service {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  return new Service({
    name: "DsyncService",
    script: path.join(__dirname, "./serviceScript.ts"),
  });
}

export function stopSchedulerService(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(chalk.cyanBright("Stopping the scheduler service"));

    const svc: Service = getSchedulerService();

    svc.stop();

    svc.on("stop", () => {
      resolve();
    });

    svc.on("error", (err) => {
      reject(err);
    });
  });
}

export function resumeSchedulerService(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(chalk.cyanBright("Resuming the scheduler service"));

    const svc: Service = getSchedulerService();

    svc.start();

    svc.on("start", () => {
      resolve();
    });

    svc.on("error", (err) => {
      reject(err);
    });
  });
}

export function removeSchedulerService(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(chalk.cyanBright("Removing the scheduler service"));

    const svc: Service = getSchedulerService();

    svc.uninstall();

    svc.on("uninstall", () => {
      resolve();
    });

    svc.on("error", (err) => {
      reject(err);
    });
  });
}
