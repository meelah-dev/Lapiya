import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://kaftandev:@localhost:5433/lafiya';

export const pool = new pg.Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
export type DbClient = typeof db;
export * as schema from './schema';
