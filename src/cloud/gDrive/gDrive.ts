import fs from "fs";
import path from "path";
import { Auth, google, drive_v3 } from "googleapis";
import mime from "mime-types";
import chalk from "chalk";

export async function uploadToDrive(
  backupFilePath: string,
  keyFilePath: string,
  parentFolderId: string
): Promise<void> {
  console.log(chalk.blue("Uploading file to Google Drive"));

  const auth: Auth.GoogleAuth = new google.auth.GoogleAuth({
    keyFile: path.resolve(keyFilePath),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive: drive_v3.Drive = google.drive({
    version: "v3",
    auth,
  });

  const fileMetadata: any = {
    name: path.basename(backupFilePath),
    parents: [parentFolderId],
  };

  const media: any = {
    mimeType: mime.lookup(backupFilePath) || "application/octet-stream",
    body: fs.createReadStream(path.resolve(backupFilePath)),
  };

  drive.files
    .create({
      requestBody: fileMetadata,
      media: media,
      fields: "name",
    })
    .then((res) => {
      console.log(
        chalk.green(
          "File uploaded successfully to Google Drive: ",
          res.data.name
        )
      );
    })
    .catch((err) => {
      console.log(chalk.red("Error uploading file to Google Drive: ", err));
    });
}
