import { dbReady } from './db';
import { seedDatabase } from './seed';

async function main() {
  try {
    await dbReady;
    await seedDatabase();
    console.log('✅ Seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
  process.exit(0);
}

main();
