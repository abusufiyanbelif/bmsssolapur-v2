
#!/usr/bin/env node
/**
 * Verify IAM roles for Firebase App Hosting backend service account
 * Usage: npm run verify:iam
 */

import { execSync } from "child_process";

const REQUIRED_ROLES = [
  "roles/firebase.admin",
  "roles/datastore.user",
  "roles/logging.viewer",
  "roles/aiplatform.user",
  "roles/storage.admin"
];

function run(cmd) {
  try {
    return execSync(cmd, { stdio: "pipe" }).toString().trim();
  } catch (e) {
    console.error("❌ Command failed:", cmd);
    process.exit(1);
  }
}

console.log("\n🔍 Checking Firebase project configuration...\n");
const projectId = run("gcloud config get-value project");
if (!projectId) {
  console.error("⚠️  No active gcloud project found. Run: gcloud config set project <your-project-id>");
  process.exit(1);
}

const serviceAccount = `firebase-app-hosting-compute@${projectId}.iam.gserviceaccount.com`;
console.log(`Project ID: ${projectId}`);
console.log(`Service Account: ${serviceAccount}\n`);

const policy = run(`gcloud projects get-iam-policy ${projectId} --flatten="bindings[].members" --format="json"`);
const data = JSON.parse(policy);

console.log("🧾 Checking roles...\n");

REQUIRED_ROLES.forEach((role) => {
  const found = data.some(
    (entry) =>
      entry.bindings &&
      entry.bindings.role === role &&
      entry.bindings.members.includes(`serviceAccount:${serviceAccount}`)
  );
  if (found) {
    console.log(`✅ ${role}`);
  } else {
    console.log(`❌ ${role} (Missing)`);
    console.log(
      `   ➜ To fix: gcloud projects add-iam-policy-binding ${projectId} --member="serviceAccount:${serviceAccount}" --role="${role}"`
    );
  }
});
console.log("\n✅ Verification complete.\n");
