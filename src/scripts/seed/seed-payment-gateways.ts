
import { seedPaymentGateways } from '@/services/seed-service';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

dotenv.config();

async function run() {
  const startTime = performance.now();
  console.log('Seeding Payment Gateway Settings...');
  try {
    const result = await seedPaymentGateways();
    console.log(`\n✅ SUCCESS: ${result.message}`);
    if (result.details) {
        result.details.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to seed payment gateways.');
    console.error('------------------------------------------');
    console.error('Error Details:', e.message);
    console.error('------------------------------------------');
    console.log('\nThis usually indicates a problem connecting to the database or a permissions issue. Please run `npm run test:db` to diagnose.');
  } finally {
    const endTime = performance.now();
    console.log(`\n✨ Done in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
    process.exit();
  }
}

run();
