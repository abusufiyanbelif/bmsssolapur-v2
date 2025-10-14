
import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const tests = [
  { name: 'Database Connection', command: 'npm run test:db' },
  { name: 'Gemini AI API', command: 'npm run test:gemini' },
  { name: 'Twilio SMS Service', command: 'npm run test:twilio' },
  { name: 'Nodemailer Email Service', command: 'npm run test:nodemailer' },
  { name: 'IAM Role Permissions', command: 'npm run verify:iam' }
];

async function runHealthCheck() {
  console.log('🚀 Starting Application Health Check...\n');
  
  const results = [];
  let allPassed = true;

  for (const test of tests) {
    process.stdout.write(`- Running: ${test.name}... `);

    try {
      const output = await new Promise<string>((resolve, reject) => {
        exec(test.command, (error, stdout, stderr) => {
          if (error) {
            // Check for specific success messages even if the script exits with an error code (e.g. verify:iam)
            if(stdout.includes('✅')) {
               resolve(stdout);
               return;
            }
            reject(new Error(stderr || stdout));
            return;
          }
          resolve(stdout);
        });
      });

      const isSuccess = output.includes('✅ SUCCESS');
      const isIAMSuccess = output.includes('✅ All required IAM roles are present');

      if (isSuccess || isIAMSuccess) {
        console.log('✅ Passed');
        results.push({ name: test.name, status: 'Passed', output });
      } else {
        allPassed = false;
        console.log('❌ Failed');
        results.push({ name: test.name, status: 'Failed', output });
      }
    } catch (e: any) {
      allPassed = false;
      console.log('❌ Error');
      results.push({ name: test.name, status: 'Error', output: e.message });
    }
  }

  console.log('\n--- Health Check Summary ---');
  results.forEach(result => {
    if (result.status !== 'Passed') {
      console.log(`\n❌ ${result.name}: ${result.status}`);
      console.log('------------------------------------------');
      console.log(result.output);
      console.log('------------------------------------------');
    }
  });

  if (allPassed) {
    console.log('\n✅ All systems are operational!');
  } else {
    console.log('\n⚠️  One or more health checks failed. Please review the output above.');
  }

  process.exit(allPassed ? 0 : 1);
}

runHealthCheck();
