
/**
 * @fileOverview A script to run the Next.js build, log its output,
 * and create an error file if the build fails.
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const buildLogPath = path.join(process.cwd(), 'build_log.txt');
const buildErrorPath = path.join(process.cwd(), 'build_error.txt');

console.log('🚀 Starting custom build process...');

// Clear previous log files
if (fs.existsSync(buildLogPath)) fs.unlinkSync(buildLogPath);
if (fs.existsSync(buildErrorPath)) fs.unlinkSync(buildErrorPath);

const buildProcess = exec('npm run build');

let fullOutput = '';
let errorOutput = '';

// Capture stdout and append to the full output
buildProcess.stdout.on('data', (data) => {
  process.stdout.write(data); // Stream to console in real-time
  fullOutput += data;
});

// Capture stderr and append to both logs
buildProcess.stderr.on('data', (data) => {
  process.stderr.write(data); // Stream to console in real-time
  fullOutput += data;
  errorOutput += data;
});

// Handle the completion of the build process
buildProcess.on('close', (code) => {
  console.log('\n------------------------------------------');
  
  // Always write the full build log
  fs.writeFileSync(buildLogPath, fullOutput, 'utf8');
  console.log(`📝 Full build log saved to: ${buildLogPath}`);

  if (code === 0) {
    console.log('✅ Build Succeeded!');
  } else {
    console.error(`❌ Build Failed with exit code ${code}`);
    
    // On failure, create a separate, cleaner error file
    fs.writeFileSync(buildErrorPath, errorOutput, 'utf8');
    console.error(`📄 Detailed error log saved to: ${buildErrorPath}`);
    console.log('\nTo get a fix, please copy the contents of build_error.txt and paste it in the chat.');
  }

  console.log('------------------------------------------');
});
