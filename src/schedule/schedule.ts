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

  const backupQueue: any = new Queue("backupQueue", {
    redis: {
      host: "127.0.0.1",
      port: 6379,
    },
  });

  console.log(chalk.cyanBright("Clearing any previous job configurations"));

  await backupQueue.obliterate({ force: true });

  await backupQueue.add("scheduled-backup", jobData, {
    repeat: { cron: interval },
  });
}

export function installSchedulerService(): void {
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
    console.log(chalk.green("Service installed successfully"));
    svc.start();
  });

  svc.on("error", (err) => {
    console.error(chalk.red("Service encountered an error:", err));
  });
}
