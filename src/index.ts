#!/usr/bin/env node
// in index.ts
const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const path = require("path");
const { program } = require("commander");
const { printMessage } = require("./utils");

clear();
console.log(
  chalk.magenta(figlet.textSync("dsync-cli", { horizontalLayout: "full" }))
);

program
  .name("dsync")
  .version("1.0.0")
  .description("A CLI for backing up your database")
  .option("-h, --helloWorld", "print hello world message")
  .parse(process.argv);

const options = program.opts();

if (Object.keys(options).length === 0) {
  program.outputHelp();
} else {
  if (options.helloWorld) {
    printMessage("Hello World!");
  }
}
