#!/usr/bin/env node
import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import { program } from "commander";
import YAML from "yaml";
import { loadFile } from "./utils/fileUtils.js";
import { createBackup, restoreBackup } from "./database/mysql/mysql.js";
import { uploadToDrive } from "./cloud/gDrive/gDrive.js";
import {
  setupScheduler,
  installSchedulerService,
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
  .option("-o, --output <path>", "Path to save the backup", "./backups")
  .option("-z, --zip", "Compress the backup")
  .option("-e, --encrypt", "Encrypt the backup")
  .action((options: any) => {
    const data: string = loadFile(options.config);

    const dbConfig: any = YAML.parse(data);

    createBackup(dbConfig, options.output, options.zip, options.encrypt);
  });

program
  .command("restore")
  .description("Restore a database from a backup file")
  .requiredOption("-f, --file <path>", "Path to the backup file")
  .option("-c, --config <path>", "Path to config file")
  .option(
    "-o, --output <path>",
    "Output path for the SQL dump (if not restoring directly)",
    "./backups"
  )
  .option(
    "--no-direct",
    "Do not restore directly to the database, create SQL dump instead"
  )
  .action(async (options) => {
    let dbConfig: any;

    if (options.direct) {
      if (!options.config) {
        console.error(
          chalk.red("Please provide a config file for direct restore")
        );
        process.exit(1);
      }

      const data = loadFile(options.config);

      dbConfig = YAML.parse(data);
    }

    restoreBackup(options.file, options.output, options.direct, dbConfig);
  });

program
  .command("upload")
  .description("Upload backup to Google Drive")
  .requiredOption("-f, --file <path>", "Path to the backup file")
  .requiredOption(
    "-k, --key <path>",
    "Path to Google credentials JSON  key file"
  )
  .requiredOption(
    "-p, --parent <id>",
    "ID of the parent folder in Google Drive where the file will be uploaded"
  )
  .action(async (options) => {
    try {
      await uploadToDrive(options.file, options.key, options.parent);
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command("schedule")
  .description("Schedule regular backups")
  .option("-i, --interval <cron>", "Cron expression for scheduling the backup")
  .option("-c, --config <path>", "Path to config file")
  .option("-o, --output <path>", "Path to save the backup", "./backups")
  .option("-z, --zip", "Compress the backup")
  .option("-e, --encrypt", "Encrypt the backup")

  .action(async (options) => {
    try {
      const data: string = loadFile(options.config);

      const dbConfig: any = YAML.parse(data);

      const jobData: any = {
        dbConfig,
        output: options.output,
        zip: options.zip,
        encrypt: options.encrypt,
      };

      await setupScheduler(jobData, options.interval);

      installSchedulerService();
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program.parse(process.argv);
