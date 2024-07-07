import fs from "fs";
import zlib from "zlib";
import chalk from "chalk";

export function createGzipCompressor(pipelineStages: any[]): void {
  console.log(chalk.blue("Creating gzip compressor..."));
  pipelineStages.push(zlib.createGzip());
}
