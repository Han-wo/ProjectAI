import { Pool, type QueryResultRow } from "pg";

export interface PostgresConfig {
  connectionString: string;
  max?: number;
}

export const createPostgresPool = (config: PostgresConfig): Pool =>
  new Pool({
    connectionString: config.connectionString,
    max: config.max
  });

export const queryRows = async <T extends QueryResultRow = QueryResultRow>(
  pool: Pool,
  sql: string,
  params: unknown[] = []
): Promise<T[]> => {
  const result = await pool.query<T>(sql, params);
  return result.rows;
};
