import { uploadToDrive } from "./gDrive/gDrive.js";

import { uploadToS3 } from "./s3/s3.js";

export async function uploadBackup(
  backupFilePath: string,
  keyFilePath: string,
  uploadType: string,
  destination: string,
  region: string
): Promise<void> {
  if (!keyFilePath || !destination) {
    throw new Error("Key file and destination are required for upload");
  }

  switch (uploadType) {
    case "s3":
      await uploadToS3(backupFilePath, keyFilePath, destination, region);
      break;
    case "drive":
      await uploadToDrive(backupFilePath, keyFilePath, destination);
      break;
    default:
      throw new Error("Invalid upload type. Use 's3' or 'drive'.");
  }
}
