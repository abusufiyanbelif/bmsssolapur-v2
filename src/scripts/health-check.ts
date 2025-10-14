
import { exec } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const tests = [
  { name: 'Database Connection', command: 'npm run test:db' },
  { name: 'Admin User Login', command: 'npm run test:admin-login' },
  { name: 'Gemini AI API', command: 'npm run test:gemini' },
  { name: 'Twilio SMS Service', command: 'npm run test:twilio' },
  { name: 'Nodemailer Email Service', command: 'npm run test:nodemailer' },
  { name: 'IAM Role Permissions', command: 'npm run verify:iam' }
];

const uiConfigTests = [
    { name: 'Tailwind Config', path: './tailwind.config.ts' },
    { name: 'ShadCN Components Config', path: './components.json' },
    { name: 'Global CSS', path: './src/app/globals.css' },
];

async function runHealthCheck() {
  console.log('🚀 Starting Application Health Check...\n');
  
  const results = [];
  let allPassed = true;

  console.log('--- Backend & Service Connectivity ---');
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
  
  console.log('\n--- UI Configuration Files ---');
  for (const test of uiConfigTests) {
      process.stdout.write(`- Checking: ${test.name}... `);
      try {
          await fs.access(path.join(process.cwd(), test.path));
          console.log('✅ Present');
          results.push({ name: test.name, status: 'Passed', output: 'File exists.' });
      } catch (e) {
          allPassed = false;
          console.log('❌ Missing');
          results.push({ name: test.name, status: 'Failed', output: `Critical file is missing at: ${test.path}` });
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
