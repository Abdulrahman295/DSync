import fs from "fs";
import path from "path";
import "dotenv/config";
import nodemailer from "nodemailer";
import Handlebars from "handlebars";

function getTransport(): nodemailer.Transporter {
  if (!process.env.EMAIL || !process.env.PASSWORD) {
    throw new Error(
      "Email and password are required in the environment variables to send reports"
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });
}

function getLogData(): any {
  const logContent: string = fs
    .readFileSync(path.join(process.cwd(), "backup_status.log"))
    .toString();

  return logContent
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line).message)
    .filter((entry) => entry.type === "backup");
}

function generateReport(): string {
  const logData: any = getLogData();

  const successfulBackups: any = logData.filter(
    (entry: any) => entry.status === "success"
  );
  const failedBackups: any = logData.filter(
    (entry: any) => entry.status === "fail"
  );

  const recentSuccess: any = successfulBackups
    .sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 5);

  const recentFail: any = failedBackups
    .sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 5);

  const reportData: any = {
    date: new Date().toDateString(),
    totalBackups: logData.length,
    numSuccess: successfulBackups.length,
    numFail: failedBackups.length,
    successfulRecords: recentSuccess,
    failedRecords: recentFail,
  };

  const templateSource: string = fs.readFileSync(
    path.resolve("src/mail/reportTemplate.hbs"),
    "utf-8"
  );

  const template: HandlebarsTemplateDelegate<any> =
    Handlebars.compile(templateSource);

  return template(reportData);
}

export async function sendReport(recipientMail: string): Promise<void> {
  const transporter: nodemailer.Transporter = getTransport();

  const report: string = generateReport();

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: recipientMail,
    subject: "Daily Backup Report",
    html: report,
  });
}
