import fs from "fs";
import zlib from "zlib";
import chalk from "chalk";

export function addGzipCompressor(pipelineStages: any[]): void {
  console.log(chalk.blue("Creating gzip compressor"));
  pipelineStages.push(zlib.createGzip());
}

export function addGzipDecompressor(pipelineStages: any[]): void {
  console.log(chalk.blue("Creating gzip decompressor"));
  pipelineStages.push(zlib.createGunzip());
}
