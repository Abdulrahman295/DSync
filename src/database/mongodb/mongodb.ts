import { spawn } from "child_process";

export function createMongoDumpStream(dbConfig: any): any {
  return spawn("mongodump", [
    `--host=${dbConfig.host}`,
    `--port=${dbConfig.port}`,
    `--username=${dbConfig.user}`,
    `--password=${dbConfig.password}`,
    `--db=${dbConfig.database}`,
    `--authenticationDatabase=admin`,
    `--archive`,
  ]).stdout;
}

export function createMongoRestoreStream(dbConfig: any): any {
  return spawn("mongorestore", [
    `--host=${dbConfig.host}`,
    `--port=${dbConfig.port}`,
    `--username=${dbConfig.user}`,
    `--password=${dbConfig.password}`,
    `--db=${dbConfig.database}`,
    `--authenticationDatabase=admin`,
    `--archive`,
  ]).stdin;
}
