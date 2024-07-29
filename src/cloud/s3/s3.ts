import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  S3Client,
  CompleteMultipartUploadCommandOutput,
  UploadPartCommandOutput,
  CreateMultipartUploadCommandOutput,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { loadFile } from "../../utils/file.js";
import chalk from "chalk";
import retry from "retry";

async function getUploadID(
  client: S3Client,
  backupFilePath: string,
  s3Bucket: string
): Promise<string> {
  const uploadParams: any = {
    Bucket: s3Bucket,
    Key: path.basename(backupFilePath),
  };

  const command: CreateMultipartUploadCommand =
    new CreateMultipartUploadCommand(uploadParams);

  const data: CreateMultipartUploadCommandOutput = await client.send(command);

  if (!data.UploadId) {
    throw new Error("Upload ID not found");
  }

  return data.UploadId;
}

async function uploadPart(
  client: S3Client,
  backupFilePath: string,
  s3Bucket: string,
  partNumber: number,
  partSize: number,
  uploadId: string
): Promise<string> {
  const start: number = partSize * (partNumber - 1);
  const end: number = Math.min(
    start + partSize,
    fs.statSync(backupFilePath).size - 1
  );

  const uploadParams: any = {
    Bucket: s3Bucket,
    Key: path.basename(backupFilePath),
    PartNumber: partNumber,
    UploadId: uploadId,
    Body: fs.createReadStream(path.resolve(backupFilePath), { start, end }),
  };

  const command: UploadPartCommand = new UploadPartCommand(uploadParams);

  const data: UploadPartCommandOutput = await client.send(command);

  if (!data.ETag) {
    throw new Error("ETag not found");
  }

  return data.ETag;
}

async function completeUpload(
  client: S3Client,
  backupFilePath: string,
  s3Bucket: string,
  uploadId: string,
  partsData: any
): Promise<string> {
  const uploadParams: any = {
    Bucket: s3Bucket,
    Key: path.basename(backupFilePath),
    UploadId: uploadId,
    MultipartUpload: {
      Parts: partsData,
    },
  };

  const command: CompleteMultipartUploadCommand =
    new CompleteMultipartUploadCommand(uploadParams);

  const data: CompleteMultipartUploadCommandOutput = await client.send(command);

  if (!data.Location) {
    throw new Error("Upload location not found");
  }

  return data.Location;
}

export async function uploadToS3(
  backupFilePath: string,
  keyFilePath: string,
  s3Bucket: string,
  region: string
) {
  console.log(chalk.blue("Uploading file to s3"));

  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found: ${backupFilePath}`);
  }

  if (!fs.existsSync(keyFilePath)) {
    throw new Error(`Key file not found: ${keyFilePath}`);
  }

  const awsCredentials: any = JSON.parse(loadFile(keyFilePath));

  const client: S3Client = new S3Client({
    endpoint: "http://127.0.0.1:4566", // Localstack endpoint
    region,
    credentials: awsCredentials,
    forcePathStyle: true, // Required for localstack
  });

  const uploadId: string = await getUploadID(client, backupFilePath, s3Bucket);

  let partNumber: number = 1;
  const partSize: number = 5 * 1024 * 1024;
  const fileSize: number = fs.statSync(backupFilePath).size;
  const totalParts: number = Math.ceil(fileSize / partSize);
  const partsData: {
    PartNumber: number;
    ETag: string;
  }[] = [];

  const operation: retry.RetryOperation = retry.operation({
    retries: 4,
    factor: 2,
    minTimeout: 60 * 1000,
    maxTimeout: 5 * 60 * 1000,
    randomize: true,
  });

  operation.attempt(async (currentAttempt) => {
    try {
      while (partNumber <= totalParts) {
        const ETag: string = await uploadPart(
          client,
          backupFilePath,
          s3Bucket,
          partNumber,
          partSize,
          uploadId
        );

        partsData.push({
          PartNumber: partNumber,
          ETag,
        });

        partNumber++;
      }

      const location = await completeUpload(
        client,
        backupFilePath,
        s3Bucket,
        uploadId,
        partsData
      );

      console.log(
        chalk.green(`File uploaded successfully to location: ${location}`)
      );
    } catch (err: any) {
      console.log(
        chalk.yellow(`Upload attempt ${currentAttempt} failed: ${err}`)
      );

      if (operation.retry(err)) {
        console.log(chalk.yellow(`Retrying upload...`));
      } else {
        console.log(chalk.red("Error uploading file to S3 after all retries"));
      }
    }
  });
}
