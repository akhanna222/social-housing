#!/usr/bin/env tsx
// Database Seed Script
// Run with: npm run seed

import { initializeDatabase, getDatabase, closeDatabase } from './schema.js';
import { applicationRepository } from './repositories.js';
import type { ApplicantData } from '../types/index.js';

console.log('Seeding database with sample data...');

try {
  // Ensure database is initialized
  initializeDatabase();

  const db = getDatabase();

  // Check if we already have data
  const existingApps = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };

  if (existingApps.count > 0) {
    console.log('Database already contains data. Skipping seed.');
    console.log(`Found ${existingApps.count} existing applications.`);
  } else {
    // Create sample applications
    const sampleApplications: Array<{ cluid: string; applicantData: ApplicantData }> = [
      {
        cluid: 'demo-user-001',
        applicantData: {
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          phone: '07700 900123',
          dateOfBirth: '1985-03-15',
          address: {
            line1: '123 High Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'United Kingdom',
          },
          householdSize: 3,
          householdMembers: [
            {
              firstName: 'Jane',
              lastName: 'Smith',
              relationship: 'spouse',
              dateOfBirth: '1987-07-22',
            },
            {
              firstName: 'Tom',
              lastName: 'Smith',
              relationship: 'child',
              dateOfBirth: '2015-11-10',
            },
          ],
        },
      },
      {
        cluid: 'demo-user-002',
        applicantData: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.j@example.com',
          phone: '07700 900456',
          dateOfBirth: '1990-09-28',
          address: {
            line1: '45 Oak Lane',
            city: 'Manchester',
            postcode: 'M1 2AB',
            country: 'United Kingdom',
          },
          householdSize: 2,
          householdMembers: [
            {
              firstName: 'Emily',
              lastName: 'Johnson',
              relationship: 'child',
              dateOfBirth: '2018-04-05',
            },
          ],
        },
      },
      {
        cluid: 'demo-user-003',
        applicantData: {
          firstName: 'Mohammed',
          lastName: 'Ali',
          email: 'm.ali@example.com',
          phone: '07700 900789',
          dateOfBirth: '1978-12-03',
          address: {
            line1: '78 Park Road',
            city: 'Birmingham',
            postcode: 'B1 1AA',
            country: 'United Kingdom',
          },
          householdSize: 5,
          householdMembers: [
            {
              firstName: 'Fatima',
              lastName: 'Ali',
              relationship: 'spouse',
              dateOfBirth: '1982-05-18',
            },
            {
              firstName: 'Ahmed',
              lastName: 'Ali',
              relationship: 'child',
              dateOfBirth: '2008-02-14',
            },
            {
              firstName: 'Yasmin',
              lastName: 'Ali',
              relationship: 'child',
              dateOfBirth: '2012-08-30',
            },
            {
              firstName: 'Omar',
              lastName: 'Ali',
              relationship: 'child',
              dateOfBirth: '2016-01-20',
            },
          ],
        },
      },
    ];

    for (const app of sampleApplications) {
      const created = applicationRepository.create(app.cluid, app.applicantData);
      console.log(`✓ Created application: ${created.referenceNumber} for ${app.applicantData.firstName} ${app.applicantData.lastName}`);
    }

    console.log(`\n✓ Seeded ${sampleApplications.length} sample applications`);
  }

  console.log('\n✓ Database seeding completed successfully');
} catch (error) {
  console.error('✗ Seeding failed:', error);
  process.exit(1);
} finally {
  closeDatabase();
}
