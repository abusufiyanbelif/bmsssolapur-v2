
/**
 * @fileOverview A comprehensive health check script for the application.
 */

import { exec } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

dotenv.config();

const backendTests = [
  { name: 'Database Connection', command: 'npm run test:db' },
  { name: 'Default Admin Login', command: 'npm run test:admin-login' },
];

const serviceTests = [
  { name: 'Google Gemini AI API', command: 'npm run test:gemini' },
  { name: 'Twilio SMS Service', command: 'npm run test:twilio' },
  { name: 'Nodemailer Email Service', command: 'npm run test:nodemailer' },
];

const permissionTests = [
    { name: 'Cloud IAM Role Permissions', command: 'npm run verify:iam' },
];

const uiConfigTests = [
    { name: 'Tailwind CSS Config', path: './tailwind.config.ts' },
    { name: 'ShadCN Components Config', path: './components.json' },
    { name: 'Global CSS & Theme', path: './src/app/globals.css' },
];

type TestStatus = 'Passed' | 'Failed' | 'Warning' | 'Error';
type TestResult = { name: string; status: TestStatus; output: string, duration: number };

async function runHealthCheck() {
  console.log('🚀 Starting Application Health Check...\n');
  const overallStartTime = performance.now();
  
  const allResults: TestResult[] = [];

  const runCommandTests = async (tests: {name: string, command: string}[], category: string) => {
    console.log(`--- ${category} ---`);
    for (const test of tests) {
      const testStartTime = performance.now();
      process.stdout.write(`- Running: ${test.name}... `);

      try {
        const output = await new Promise<string>((resolve, reject) => {
          exec(test.command, (error, stdout, stderr) => {
            const combinedOutput = stdout + stderr;
            if (error && !combinedOutput.includes('✅') && !combinedOutput.includes('⚠️')) {
              reject(new Error(stderr || stdout));
              return;
            }
            resolve(combinedOutput);
          });
        });
        
        const duration = performance.now() - testStartTime;
        let status: TestStatus = 'Failed'; // Default to failed
        
        if (output.includes('✅ SUCCESS') || output.includes('✅ All required IAM roles are present')) status = 'Passed';
        else if (output.includes('⚠️ WARNING')) status = 'Warning';
        else if (output.includes('❌ ERROR')) status = 'Failed';

        const statusIcon = status === 'Passed' ? '✅' : status === 'Warning' ? '⚠️' : '❌';
        process.stdout.write(`${statusIcon} ${status} (${(duration / 1000).toFixed(2)}s)\n`);
        allResults.push({ name: test.name, status, output, duration });
      } catch (e: any) {
        const duration = performance.now() - testStartTime;
        process.stdout.write(`❌ Error (${(duration / 1000).toFixed(2)}s)\n`);
        allResults.push({ name: test.name, status: 'Error', output: e.message, duration });
      }
    }
  }

  const runFileCheckTests = async (tests: {name: string, path: string}[], category: string) => {
      console.log(`\n--- ${category} ---`);
      for (const test of tests) {
          const testStartTime = performance.now();
          process.stdout.write(`- Checking: ${test.name}... `);
          try {
              await fs.access(path.join(process.cwd(), test.path));
              const duration = performance.now() - testStartTime;
              process.stdout.write(`✅ Passed (${duration.toFixed(2)}ms)\n`);
              allResults.push({ name: test.name, status: 'Passed', output: 'File exists.', duration });
          } catch (e) {
              const duration = performance.now() - testStartTime;
              process.stdout.write(`❌ Failed (${duration.toFixed(2)}ms)\n`);
              allResults.push({ name: test.name, status: 'Failed', output: `Critical file is missing at: ${test.path}`, duration });
          }
      }
  }

  await runCommandTests(backendTests, 'Backend & Database');
  await runCommandTests(serviceTests, 'External Service Integrations');
  await runCommandTests(permissionTests, 'Cloud Permissions');
  await runFileCheckTests(uiConfigTests, 'UI Configuration Files');

  const overallEndTime = performance.now();
  const totalDuration = (overallEndTime - overallStartTime) / 1000;

  console.log('\n--- Health Check Summary ---');
  const summary = allResults.reduce((acc, result) => {
      if (!acc[result.status]) acc[result.status] = [];
      acc[result.status].push(result);
      return acc;
  }, {} as Record<TestStatus, TestResult[]>);

  const totalTests = allResults.length;
  const passedCount = summary['Passed']?.length || 0;
  const failedCount = (summary['Failed']?.length || 0) + (summary['Error']?.length || 0);
  const warningCount = summary['Warning']?.length || 0;

  const printResults = (results: TestResult[], status: 'PASSED' | 'FAILED' | 'WARNING') => {
      if (!results || results.length === 0) return;
      results.forEach(result => {
        console.log(`\n[${status}] ${result.name} (took ${(result.duration / 1000).toFixed(2)}s)`);
        console.log('------------------------------------------');
        const cleanOutput = result.output.split('\n').filter(line => !line.startsWith('> ')).join('\n');
        console.log(cleanOutput.trim());
        console.log('------------------------------------------');
      });
  }
  
  // Print detailed logs for all categories
  if (failedCount > 0) {
      console.log(`\n❌ CRITICAL ISSUES FOUND: ${failedCount} test(s) failed.`);
      printResults((summary['Failed'] || []).concat(summary['Error'] || []), 'FAILED');
  }
   if (warningCount > 0) {
      console.log(`\n⚠️ WARNINGS: ${warningCount} test(s) returned a warning.`);
      printResults(summary['Warning'] || [], 'WARNING');
  }
  if (passedCount > 0) {
      console.log(`\n✅ PASSED CHECKS: ${passedCount} test(s) passed successfully.`);
      printResults(summary['Passed'] || [], 'PASSED');
  }

  console.log(`\n📊 Final Summary: ${passedCount} Passed, ${failedCount} Failed, ${warningCount} Warnings. (Total duration: ${totalDuration.toFixed(2)}s)`);
}

runHealthCheck();
