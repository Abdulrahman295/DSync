import fs from "fs";
import path from "path";
import { Auth, google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import mime from "mime-types";
import chalk from "chalk";
import retry from "retry";
import { Response } from "node-fetch";
import fetch from "node-fetch";
import { getFileSize } from "../../utils/fileUtils.js";

async function getResumePosition(
  sessionURL: string,
  fileSize: number
): Promise<number> {
  console.log(
    chalk.blue("Fetching resume position in case of incomplete upload")
  );

  let resumePosition: number = 0;

  const INCOMPLETE_STATUS: number = 308;

  const res: Response = await fetch(sessionURL, {
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
  console.log(chalk.blue("Fetching session URL for file upload"));

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

  const accessToken: string | null | undefined = (await client.getAccessToken())
    .token;

  if (!accessToken) {
    throw new Error("Failed to obtain access token");
  }

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

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  const sessionURL: string | null = res.headers.get("Location");

  if (!sessionURL) {
    throw new Error("Session URL not found in response headers");
  }

  return sessionURL;
}

export async function uploadToDrive(
  backupFilePath: string,
  keyFilePath: string,
  parentFolderId: string
): Promise<void> {
  console.log(chalk.blue("Uploading file to Google Drive"));

  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found: ${backupFilePath}`);
  }

  if (!fs.existsSync(keyFilePath)) {
    throw new Error(`Key file not found: ${keyFilePath}`);
  }

  const sessionURL: string = await getSessionURL(
    backupFilePath,
    keyFilePath,
    parentFolderId
  );

  const operation: retry.RetryOperation = retry.operation({
    retries: 4,
    factor: 2,
    minTimeout: 60 * 1000,
    maxTimeout: 5 * 60 * 1000,
    randomize: true,
  });

  const fileSize: number = getFileSize(backupFilePath);

  operation.attempt(async (currentAttempt) => {
    try {
      const startByte: number = await getResumePosition(sessionURL, fileSize);

      const uploadStream: fs.ReadStream = fs.createReadStream(
        path.resolve(backupFilePath),
        {
          start: startByte,
        }
      );

      const uploadRes: Response = await fetch(sessionURL, {
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
