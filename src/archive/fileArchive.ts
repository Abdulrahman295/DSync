import fs from "fs";
import zlib from "zlib";
import chalk from "chalk";

export function compress(rstream: fs.ReadStream, outputPath: string): void {
  const gzip: zlib.Gzip = zlib.createGzip();

  const wstream: fs.WriteStream = fs.createWriteStream(outputPath);

  rstream
    .pipe(gzip)
    .pipe(wstream)
    .on("finish", function () {
      console.log(
        chalk.green(`Compressed backup created successfully at ${outputPath}`)
      );
    })
    .on("error", function (err: any) {
      console.error(err);
    });
}
