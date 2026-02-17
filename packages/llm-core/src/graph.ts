import neo4j, { type Driver } from "neo4j-driver";

export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
}

export const createNeo4jDriver = (config: Neo4jConfig): Driver =>
  neo4j.driver(config.uri, neo4j.auth.basic(config.username, config.password));

export const verifyNeo4jConnection = async (driver: Driver) => {
  await driver.verifyConnectivity();
};

export const runCypher = async <T = Record<string, unknown>>(
  driver: Driver,
  query: string,
  params: Record<string, unknown> = {}
): Promise<T[]> => {
  const session = driver.session();

  try {
    const result = await session.run(query, params);
    return result.records.map((record) => record.toObject() as T);
  } finally {
    await session.close();
  }
};
