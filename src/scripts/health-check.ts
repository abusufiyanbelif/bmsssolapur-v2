
import { exec } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

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
  const overallStartTime = performance.now();
  
  const results: { name: string; status: 'Passed' | 'Failed' | 'Error'; output: string, duration: number }[] = [];
  let allPassed = true;

  console.log('--- Backend & Service Connectivity ---');
  for (const test of tests) {
    const testStartTime = performance.now();
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
      
      const duration = performance.now() - testStartTime;
      const isSuccess = output.includes('✅ SUCCESS') || output.includes('✅ All required IAM roles are present');

      if (isSuccess) {
        process.stdout.write(`✅ Passed (${(duration / 1000).toFixed(2)}s)\n`);
        results.push({ name: test.name, status: 'Passed', output, duration });
      } else {
        allPassed = false;
        process.stdout.write(`❌ Failed (${(duration / 1000).toFixed(2)}s)\n`);
        results.push({ name: test.name, status: 'Failed', output, duration });
      }
    } catch (e: any) {
      const duration = performance.now() - testStartTime;
      allPassed = false;
      process.stdout.write(`❌ Error (${(duration / 1000).toFixed(2)}s)\n`);
      results.push({ name: test.name, status: 'Error', output: e.message, duration });
    }
  }
  
  console.log('\n--- UI Configuration Files ---');
  for (const test of uiConfigTests) {
      const testStartTime = performance.now();
      process.stdout.write(`- Checking: ${test.name}... `);
      try {
          await fs.access(path.join(process.cwd(), test.path));
          const duration = performance.now() - testStartTime;
          process.stdout.write(`✅ Present (${duration.toFixed(2)}ms)\n`);
          results.push({ name: test.name, status: 'Passed', output: 'File exists.', duration });
      } catch (e) {
          const duration = performance.now() - testStartTime;
          allPassed = false;
          process.stdout.write(`❌ Missing (${duration.toFixed(2)}ms)\n`);
          results.push({ name: test.name, status: 'Failed', output: `Critical file is missing at: ${test.path}`, duration });
      }
  }

  const overallEndTime = performance.now();
  const totalDuration = (overallEndTime - overallStartTime) / 1000;

  console.log('\n--- Health Check Summary ---');
  const failedTests = results.filter(r => r.status !== 'Passed');
  if (failedTests.length > 0) {
      failedTests.forEach(result => {
        console.log(`\n❌ ${result.name}: ${result.status} (took ${(result.duration / 1000).toFixed(2)}s)`);
        console.log('------------------------------------------');
        // Clean up the output by removing the "npm run..." lines
        const cleanOutput = result.output.split('\n').filter(line => !line.startsWith('> ')).join('\n');
        console.log(cleanOutput);
        console.log('------------------------------------------');
      });
  }

  if (allPassed) {
    console.log(`\n✅ All systems are operational! (Completed in ${totalDuration.toFixed(2)}s)`);
  } else {
    console.log(`\n⚠️  Found ${failedTests.length} issue(s). Please review the output above. (Completed in ${totalDuration.toFixed(2)}s)`);
  }

  process.exit(allPassed ? 0 : 1);
}

runHealthCheck();
