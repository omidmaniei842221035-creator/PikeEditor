import { seedDatabase } from './seed';

async function main() {
  try {
    await seedDatabase();
    console.log('✅ Seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
  process.exit(0);
}

main();