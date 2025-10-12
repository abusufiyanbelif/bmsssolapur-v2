
import { seedCoreTeam } from '@/services/seed-service';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('Seeding Core Team Members...');
  try {
    const result = await seedCoreTeam();
    console.log('\n✅ SUCCESS: Core team seeding complete!');
    if (result.details) {
        result.details.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to seed core team.');
    console.error(e.message);
  } finally {
    process.exit();
  }
}

run();
