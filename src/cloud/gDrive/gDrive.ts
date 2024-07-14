import fs from "fs";
import path from "path";
import { Auth, google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import mime from "mime-types";
import chalk from "chalk";
import retry from "retry";
import { Response } from "node-fetch";
import fetch from "node-fetch";

async function getResumePosition(
  sessionUrl: string,
  fileSize: number
): Promise<number> {
  let resumePosition: number = 0;

  const INCOMPLETE_STATUS = 308;

  const res: Response = await fetch(sessionUrl, {
    method: "PUT",
    headers: {
      "Content-Range": `bytes */${fileSize}`,
    },
  });

  if (res.status === INCOMPLETE_STATUS) {
    const range: string | null = res.headers.get("Range");

    if (range) {
      resumePosition = parseInt(range.split("-")[1]) + 1;
    }
  }

  return resumePosition;
}

async function getSessionURL(
  backupFilePath: string,
  keyFilePath: string,
  parentFolderId: string
): Promise<string> {
  const auth: Auth.GoogleAuth = new google.auth.GoogleAuth({
    keyFile: path.resolve(keyFilePath),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const fileMetadata: any = {
    name: path.basename(backupFilePath),
    parents: [parentFolderId],
    mimeType: mime.lookup(backupFilePath) || "application/octet-stream",
  };

  const client: OAuth2Client = (await auth.getClient()) as OAuth2Client;

  const accessToken: string = (await client.getAccessToken()).token as string;

  const res: Response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fileMetadata),
    }
  );

  const sessionUrl: string = res.headers.get("Location") as string;

  return sessionUrl;
}

export async function uploadToDrive(
  backupFilePath: string,
  keyFilePath: string,
  parentFolderId: string
): Promise<void> {
  console.log(chalk.blue("Uploading file to Google Drive"));

  const sessionUrl: string = await getSessionURL(
    backupFilePath,
    keyFilePath,
    parentFolderId
  );

  const operation = retry.operation({
    retries: 4,
    factor: 2,
    minTimeout: 60 * 1000,
    maxTimeout: 5 * 60 * 1000,
    randomize: true,
  });

  const fileSize = fs.statSync(path.resolve(backupFilePath)).size;

  operation.attempt(async (currentAttempt) => {
    try {
      const startByte = await getResumePosition(sessionUrl, fileSize);

      console.log(chalk.cyanBright(`Resuming upload from byte ${startByte}`));

      const uploadStream = fs.createReadStream(path.resolve(backupFilePath), {
        start: startByte,
      });

      const uploadRes = await fetch(sessionUrl, {
        method: "PUT",
        headers: {
          "Content-Range": `bytes ${startByte}-${fileSize - 1}/${fileSize}`,
        },
        body: uploadStream,
      });

      if (!uploadRes.ok) throw new Error(uploadRes.statusText);

      console.log(chalk.green("File uploaded successfully to Google Drive"));
    } catch (err: any) {
      console.log(
        chalk.yellow(`Upload attempt ${currentAttempt} failed: ${err}`)
      );

      if (operation.retry(err)) {
        console.log(chalk.yellow(`Retrying upload...`));
      } else {
        console.log(
          chalk.red("Error uploading file to Google Drive after all retries")
        );
      }
    }
  });
}
