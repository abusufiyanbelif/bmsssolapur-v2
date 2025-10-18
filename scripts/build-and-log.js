
/**
 * @fileOverview A script to run the Next.js build, log its output with a timestamp,
 * and create a timestamped error file if the build fails.
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// --- Timestamp Generation ---
const getTimestamp = () => {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${YYYY}-${MM}-${DD}_${HH}-${mm}-${ss}`;
};

const timestamp = getTimestamp();
const buildLogPath = path.join(process.cwd(), `build_log_${timestamp}.txt`);
const buildErrorPath = path.join(process.cwd(), `build_error_${timestamp}.txt`);

console.log(`🚀 Starting custom build process... (Timestamp: ${timestamp})`);

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
  
  // Always write the full build log with the timestamp
  fs.writeFileSync(buildLogPath, fullOutput, 'utf8');
  console.log(`📝 Full build log saved to: ${path.basename(buildLogPath)}`);

  if (code === 0) {
    console.log('✅ Build Succeeded!');
  } else {
    console.error(`❌ Build Failed with exit code ${code}`);
    
    // On failure, create a separate, timestamped error file
    fs.writeFileSync(buildErrorPath, errorOutput, 'utf8');
    console.error(`📄 Detailed error log saved to: ${path.basename(buildErrorPath)}`);
    console.log('\nTo get a fix, please copy the contents of the new error file and paste it in the chat.');
  }

  console.log('------------------------------------------');
});
