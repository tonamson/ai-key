import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
dotenv.config();
import { User } from '../users/user.entity';

// CLI dùng ts-node nên resolve từ src; production build xài dist
const isCli = process.env.TYPEORM_CLI === 'true';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: isCli ? ['src/**/*.entity.ts'] : ['dist/**/*.entity.js'],
  migrations: isCli
    ? ['src/database/migrations/*.ts']
    : ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
