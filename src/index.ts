#!/usr/bin/env node
import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import { program } from "commander";
import YAML from "yaml";
import { loadFile } from "./utils/file.js";
import { restoreBackup } from "./database/restore.js";
import { createBackup } from "./database/backup.js";
import { uploadBackup } from "./cloud/cloud.js";
import {
  setupScheduler,
  installSchedulerService,
  stopSchedulerService,
  removeSchedulerService,
  resumeSchedulerService,
} from "./schedule/schedule.js";

clear();

console.log(
  chalk.magenta(figlet.textSync("dsync-cli", { horizontalLayout: "full" }))
);

program
  .name("dsync")
  .version("1.0.0")
  .description("A CLI for backing up your database");

program
  .command("backup")
  .description("Creates a backup of the database specified in the config file")
  .requiredOption("-c, --config <path>", "Path to config file")
  .requiredOption(
    "-t, --type <type>",
    "Type of database (mysql, postgresql, mongodb)"
  )
  .option("-o, --output <path>", "Path to save the backup")
  .option("-z, --zip", "Compress the backup")
  .option("-e, --encrypt", "Encrypt the backup")
  .action(async (options: any) => {
    try {
      const data: string = loadFile(options.config);

      const dbConfig: any = YAML.parse(data);

      await createBackup(
        dbConfig,
        options.type,
        options.output,
        options.zip,
        options.encrypt
      );

      console.log(chalk.green("Backup completed successfully"));
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command("restore")
  .description("Restore a database from a backup file")
  .requiredOption("-f, --file <path>", "Path to the backup file")
  .option("-c, --config <path>", "Path to database config file")
  .option("-t, --type <type>", "Type of database (mysql, postgresql, mongodb)")
  .option(
    "-o, --output <path>",
    "Output path for the SQL dump (if not restoring directly)"
  )
  .option(
    "--no-direct",
    "Do not restore directly to the database, create SQL dump instead"
  )
  .action(async (options) => {
    try {
      let dbConfig: any;

      if (options.direct) {
        if (!options.config || !options.type) {
          throw new Error(
            "Database config and type are required for direct restore"
          );
        }

        const data: string = loadFile(options.config);

        dbConfig = YAML.parse(data);
      }

      await restoreBackup(
        options.file,
        options.output,
        options.direct,
        dbConfig,
        options.type
      );

      if (options.direct) {
        console.log(chalk.green(`Database restored successfully`));
      } else {
        console.log(chalk.green(`SQL dump created successfully`));
      }
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command("upload")
  .description("Upload backup to S3 or Google Drive")
  .requiredOption("-f, --file <path>", "Path to the backup file")
  .requiredOption("-k, --key <path>", "Path to credentials JSON file")
  .requiredOption(
    "-d, --destination <dest>",
    "S3 bucket name or Google Drive folder ID where the file will be uploaded"
  )
  .requiredOption("-t, --type <type>", "Upload type: 's3' or 'drive'")
  .option("-r, --region <region>", "AWS region for S3 upload", "us-east-1")
  .action(async (options) => {
    try {
      await uploadBackup(
        options.file,
        options.key,
        options.type,
        options.destination,
        options.region
      );
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command("schedule")
  .description("Schedule regular backups")
  .option("-i, --interval <cron>", "Cron expression for scheduling the backup")
  .option("-c, --config <path>", "Path to database config file")
  .option("-t, --type <type>", "Type of database (mysql, postgresql, mongodb)")
  .option("-o, --output <path>", "Path to save the backup")
  .option("-z, --zip", "Compress the backup")
  .option("-e, --encrypt", "Encrypt the backup")
  .option("-u, --upload <type>", "Upload type: 's3' or 'drive'")
  .option("-k, --key <path>", "Path to credentials JSON file")
  .option(
    "-d, --destination <dest>",
    "S3 bucket name or Google Drive folder ID where the file will be uploaded"
  )
  .option(
    "-m, --mail <recipient mail>",
    "Email address to send daily reports to"
  )
  .option("-r, --region <region>", "AWS region for S3 upload", "us-east-1")
  .action(async (options) => {
    try {
      const data: string = loadFile(options.config);

      const dbConfig: any = YAML.parse(data);

      const jobData: any = {
        dbConfig,
        type: options.type,
        output: options.output,
        zip: options.zip,
        encrypt: options.encrypt,
        upload: options.upload,
        key: options.key,
        destination: options.destination,
        region: options.region,
        mail: options.mail,
      };

      await setupScheduler(jobData, options.interval);

      await installSchedulerService();

      console.log(chalk.green("Scheduler service installed successfully"));
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command("stop-scheduler")
  .description("Stop the backup scheduler service")
  .action(async () => {
    try {
      await stopSchedulerService();

      console.log(chalk.green("Scheduler service stopped successfully"));
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command("resume-scheduler")
  .description("Resume the backup scheduler service")
  .action(async () => {
    try {
      await resumeSchedulerService();

      console.log(chalk.green("Scheduler service resumed successfully"));
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command("remove-scheduler")
  .description("Remove the backup scheduler service")
  .action(async () => {
    try {
      await removeSchedulerService();

      console.log(chalk.green("Scheduler service removed successfully"));
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program.parse(process.argv);
