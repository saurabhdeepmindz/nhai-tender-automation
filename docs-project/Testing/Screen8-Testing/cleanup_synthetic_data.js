#!/usr/bin/env node

/**
 * ============================================================================
 * Synthetic Data Cleanup Script for Screen 8 API Testing (Node.js)
 * ============================================================================
 * WARNING: This script will DELETE all test data created with synthetic IDs!
 * 
 * Requirements:
 *   - Node.js installed
 *   - PostgreSQL client library: npm install pg
 * 
 * Usage:
 *   node cleanup_synthetic_data.js
 *   node cleanup_synthetic_data.js --force
 *   node cleanup_synthetic_data.js --host 192.168.1.100 --database testdb
 * ============================================================================
 */

const { Client } = require('pg');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: 'nhai_tender_db'
};

let forceDelete = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--host' && args[i + 1]) config.host = args[++i];
  if (args[i] === '--port' && args[i + 1]) config.port = parseInt(args[++i]);
  if (args[i] === '--user' && args[i + 1]) config.user = args[++i];
  if (args[i] === '--database' && args[i + 1]) config.database = args[++i];
  if (args[i] === '--password' && args[i + 1]) config.password = args[++i];
  if (args[i] === '--force') forceDelete = true;
}

const client = new Client(config);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function colorize(text, color) {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
  };
  return `${colors[color] || colors.reset}${text}${colors.reset}`;
}

async function getSyntheticDataCount() {
  const result = await client.query(`
    SELECT COUNT(*) as count FROM queries 
    WHERE query_number LIKE 'QRY-SYNC-%'
  `);
  return parseInt(result.rows[0].count);
}

async function cleanupSyntheticData() {
  console.log(colorize('\n╔════════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║  Screen 8 API Testing - Synthetic Data Cleanup            ║', 'cyan'));
  console.log(colorize('║              (Node.js Implementation)                      ║', 'cyan'));
  console.log(colorize('╚════════════════════════════════════════════════════════════╝\n', 'cyan'));

  try {
    // Connect to database
    console.log(colorize('🔗 Connecting to database...', 'cyan'));
    await client.connect();
    console.log(colorize('✅ Connected to database\n', 'green'));

    // Count synthetic data
    console.log(colorize('🔍 Counting synthetic data records...', 'cyan'));
    const count = await getSyntheticDataCount();
    console.log(`Found ${count} synthetic query records\n`);

    // Check if there's anything to delete
    if (count === 0) {
      console.log(colorize('✅ No synthetic data found. Nothing to clean up.\n', 'green'));
      await client.end();
      rl.close();
      return;
    }

    // Warn and confirm deletion
    console.log(colorize('⚠️  WARNING: About to DELETE all synthetic test data!', 'yellow'));
    
    if (!forceDelete) {
      const confirm = await askQuestion('Are you sure? (Type "yes" to confirm): ');

      if (confirm.toLowerCase() !== 'yes') {
        console.log(colorize('\n❌ Cleanup cancelled\n', 'red'));
        rl.close();
        await client.end();
        return;
      }
    }

    console.log(colorize('\n🧹 Cleaning up synthetic data...\n', 'cyan'));

    // Delete in order to respect foreign key constraints
    const deletions = [
      {
        name: 'workflow executions',
        query: `
          DELETE FROM workflow_executions 
          WHERE query_id IN (
            SELECT query_id FROM queries 
            WHERE query_number LIKE 'QRY-SYNC-%'
          )
        `
      },
      {
        name: 'query history',
        query: `
          DELETE FROM query_history 
          WHERE query_id IN (
            SELECT query_id FROM queries 
            WHERE query_number LIKE 'QRY-SYNC-%'
          )
        `
      },
      {
        name: 'admin responses',
        query: `
          DELETE FROM admin_responses 
          WHERE query_id IN (
            SELECT query_id FROM queries 
            WHERE query_number LIKE 'QRY-SYNC-%'
          )
        `
      },
      {
        name: 'vector embeddings',
        query: `
          DELETE FROM vector_embeddings 
          WHERE query_id IN (
            SELECT query_id FROM queries 
            WHERE query_number LIKE 'QRY-SYNC-%'
          )
        `
      },
      {
        name: 'queries',
        query: `
          DELETE FROM queries 
          WHERE query_number LIKE 'QRY-SYNC-%'
        `
      }
    ];

    for (const deletion of deletions) {
      try {
        const result = await client.query(deletion.query);
        console.log(colorize(`✅ Deleted ${result.rowCount} ${deletion.name} records`, 'green'));
      } catch (error) {
        // Table might not exist or be empty
        if (error.code === '42P01') {
          console.log(colorize(`⚠️  Table for ${deletion.name} does not exist`, 'yellow'));
        } else {
          console.log(colorize(`⚠️  Skipped ${deletion.name}: ${error.message}`, 'yellow'));
        }
      }
    }

    // Verify cleanup
    console.log(colorize('\n🔍 Verifying cleanup...', 'cyan'));
    const remaining = await getSyntheticDataCount();

    if (remaining === 0) {
      console.log(colorize('✅ Remaining synthetic queries: 0\n', 'green'));
      console.log(colorize('✨ Cleanup process complete!\n', 'green'));
    } else {
      console.log(colorize(`⚠️  ${remaining} records still remain\n`, 'yellow'));
    }

    await client.end();
    rl.close();
  } catch (error) {
    console.error(colorize(`❌ Error during cleanup: ${error.message}`, 'red'));
    rl.close();
    await client.end();
    process.exit(1);
  }
}

// Handle SIGINT gracefully
process.on('SIGINT', async () => {
  console.log(colorize('\n\nCleanup interrupted', 'yellow'));
  rl.close();
  await client.end();
  process.exit(0);
});

// Run cleanup
cleanupSyntheticData();
