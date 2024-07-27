import { spawn } from "child_process";

export function createMysqlDumpStream(dbConfig: any): any {
  return spawn("mysqldump", [
    `--host=${dbConfig.host}`,
    `--port=${dbConfig.port}`,
    `--user=${dbConfig.user}`,
    `--password=${dbConfig.password}`,
    `--databases`,
    `${dbConfig.database}`,
  ]).stdout;
}

export function createMysqlRestoreStream(dbConfig: any): any {
  return spawn("mysql", [
    `--host=${dbConfig.host}`,
    `--port=${dbConfig.port}`,
    `--user=${dbConfig.user}`,
    `--password=${dbConfig.password}`,
    `${dbConfig.database}`,
  ]).stdin;
}
