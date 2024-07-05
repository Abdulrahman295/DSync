#!/usr/bin/env node
import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import { program } from "commander";
import YAML from "yaml";
import { loadFile } from "./utils.js";
import { createBackup } from "./database/mysql/mysql.js";

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
  .action((options: any) => {
    const data: string = loadFile(options.config);
    const config: any = YAML.parse(data);
    createBackup(config, options.output);
  });

program.parse(process.argv);
