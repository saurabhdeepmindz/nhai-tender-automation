/**
 * NHAI Tender Query Automation System
 * TypeORM Configuration for Migrations
 * 
 * This file configures TypeORM CLI for running migrations
 * 
 * File: backend/src/config/typeorm.config.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'nhai_tender_db',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});
