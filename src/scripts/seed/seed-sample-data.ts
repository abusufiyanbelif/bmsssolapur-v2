
import { seedSampleData } from '@/services/seed-service';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('Seeding Sample Data (Campaigns, Leads, Donations)...');
  try {
    const result = await seedSampleData();
    console.log('\n✅ SUCCESS: Sample data seeding complete!');
    if (result.details) {
        result.details.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to seed sample data.');
    console.error(e.message);
  } finally {
    process.exit();
  }
}

run();
