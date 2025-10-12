
import { seedPaymentGateways } from '@/services/seed-service';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('Seeding Payment Gateway Settings...');
  try {
    const result = await seedPaymentGateways();
    console.log('\n✅ SUCCESS: Payment gateway seeding complete!');
    if (result.details) {
        result.details.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to seed payment gateways.');
    console.error(e.message);
  } finally {
    process.exit();
  }
}

run();
