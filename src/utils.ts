import chalk from "chalk";
import path from "path";
import fs from "fs";

export function loadFile(filePath: string): string {
  try {
    const resolvedPath: string = path.resolve(filePath);

    console.log(chalk.blue(`Loading file from ${resolvedPath}`));

    const data: string = fs.readFileSync(resolvedPath, "utf8");

    return data;
  } catch (err) {
    console.error(chalk.red(err));
    process.exit(1);
  }
}
