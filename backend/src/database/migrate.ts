#!/usr/bin/env tsx
// Database Migration Script
// Run with: npm run migrate

import { initializeDatabase, closeDatabase } from './schema.js';

console.log('Running database migrations...');

try {
  initializeDatabase();
  console.log('✓ Migrations completed successfully');
} catch (error) {
  console.error('✗ Migration failed:', error);
  process.exit(1);
} finally {
  closeDatabase();
}
