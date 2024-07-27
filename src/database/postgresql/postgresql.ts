import { spawn } from "child_process";

export function createPostgresDumpStream(dbConfig: any): any {
  return spawn(
    "pg_dump",
    [
      `-h`,
      dbConfig.host,
      `-p`,
      dbConfig.port,
      `-U`,
      dbConfig.user,
      `-d`,
      dbConfig.database,
      `-C`,
    ],
    {
      env: { ...process.env, PGPASSWORD: dbConfig.password },
    }
  ).stdout;
}

export function createPostgresRestoreStream(dbConfig: any): any {
  return spawn(
    "psql",
    [`-h`, dbConfig.host, `-p`, dbConfig.port, `-U`, dbConfig.user, `-f`, `-`],
    {
      env: { ...process.env, PGPASSWORD: dbConfig.password },
    }
  ).stdin;
}
