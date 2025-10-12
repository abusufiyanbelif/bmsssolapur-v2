
#!/usr/bin/env node
/**
 * Verify & Auto-Fix IAM roles for Firebase App Hosting backend service account.
 * Run using:
 *   npm run verify:iam
 * or for silent auto-fix:
 *   npm run fix:iam
 */

import { execSync } from "child_process";

const REQUIRED_ROLES = [
  "roles/firebase.admin",
  "roles/datastore.user",
  "roles/logging.viewer",
  "roles/aiplatform.user",
  "roles/storage.admin"
];

function run(cmd, silent = false) {
  try {
    const result = execSync(cmd, { stdio: silent ? "pipe" : "inherit" }).toString().trim();
    return result;
  } catch (err) {
    if (!silent) console.error(`❌ Command failed: ${cmd}`);
    throw err;
  }
}

function getProjectId() {
  try {
    return run("gcloud config get-value project", true);
  } catch {
    console.error("⚠️  No active gcloud project found. Run:\n   gcloud config set project <your-project-id>");
    process.exit(1);
  }
}

function getIamPolicy(projectId) {
  try {
    const raw = run(
      `gcloud projects get-iam-policy ${projectId} --flatten="bindings[].members" --format="json"`,
      true
    );
    return JSON.parse(raw);
  } catch {
    console.error("❌ Failed to fetch IAM policy for project:", projectId);
    process.exit(1);
  }
}

function verifyAndFixRoles(autoFix = false) {
  console.log("\n🔍 Checking Firebase project configuration...\n");
  const projectId = getProjectId();
  const serviceAccount = `firebase-app-hosting-compute@${projectId}.iam.gserviceaccount.com`;

  console.log(`Project ID: ${projectId}`);
  console.log(`Service Account: ${serviceAccount}\n`);

  const policy = getIamPolicy(projectId);
  console.log("🧾 Checking roles...\n");

  REQUIRED_ROLES.forEach((role) => {
    const found = policy.some(
      (entry) =>
        entry.bindings &&
        entry.bindings.role === role &&
        entry.bindings.members.includes(`serviceAccount:${serviceAccount}`)
    );

    if (found) {
      console.log(`✅ ${role}`);
    } else {
      console.log(`❌ ${role} (Missing)`);
      const fixCmd = `gcloud projects add-iam-policy-binding ${projectId} --member="serviceAccount:${serviceAccount}" --role="${role}"`;
      console.log(`   ➜ To fix manually: ${fixCmd}`);
      if (autoFix) {
        console.log("   ⚙️  Applying fix automatically...");
        try {
          run(fixCmd);
          console.log(`   ✅ ${role} added successfully.`);
        } catch {
          console.error(`   ❌ Failed to add ${role}`);
        }
      }
    }
  });

  console.log("\n✅ IAM verification complete.\n");
}

// Detect script type
const args = process.argv.slice(2);
const autoFix = args.includes("--fix") || process.env.AUTO_FIX === "true";
verifyAndFixRoles(autoFix);
