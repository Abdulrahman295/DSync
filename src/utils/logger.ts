import winston from "winston";
import path from "path";

const logger: winston.Logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), "backup_status.log"),
    }),
  ],
});

export default logger;
