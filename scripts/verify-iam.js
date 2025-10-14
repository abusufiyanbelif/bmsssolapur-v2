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
    const result = execSync(cmd, { stdio: silent ? "pipe" : "inherit", encoding: 'utf-8' }).trim();
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

function getServiceAccountEmail() {
    try {
        const projectId = getProjectId();
        const projectNumber = run(`gcloud projects describe ${projectId} --format="value(projectNumber)"`, true);
        return `${projectNumber}-compute@developer.gserviceaccount.com`;
    } catch(e) {
        console.error("❌ Failed to determine the App Hosting service account email.");
        console.error("   Please ensure you have permissions to describe the project.");
        throw e;
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
    console.error("   Ensure you have the 'resourcemanager.projects.getIamPolicy' permission.");
    process.exit(1);
  }
}

function verifyAndFixRoles(autoFix = false) {
  console.log("\n🔍 Checking Firebase project configuration...\n");
  const projectId = getProjectId();
  const serviceAccount = getServiceAccountEmail();

  console.log(`Project ID: ${projectId}`);
  console.log(`Service Account: ${serviceAccount}\n`);

  const policy = getIamPolicy(projectId);
  let missingRoles = 0;
  console.log("🧾 Checking for required IAM roles...\n");

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
      missingRoles++;
      console.log(`❌ ${role} (Missing)`);
      // FIX: Add --condition=None to handle projects with existing conditional bindings
      const fixCmd = `gcloud projects add-iam-policy-binding ${projectId} --member="serviceAccount:${serviceAccount}" --role="${role}" --condition=None`;
      console.log(`   ➜ To fix manually: ${fixCmd}`);
      if (autoFix) {
        console.log("   ⚙️  Applying fix automatically...");
        try {
          run(fixCmd, true); // Run silently
          console.log(`   ✅ ${role} added successfully.`);
        } catch (err) {
          console.error(`   ❌ Failed to add ${role}. Please check the error output above or run the command manually.`);
          // Log the actual error from the command if available
          if (err.stderr) console.error(`   Error details: ${err.stderr}`);
        }
      }
    }
  });

  if (missingRoles === 0) {
      console.log("\n✅ All required IAM roles are present. Your App Hosting backend should have the necessary permissions.");
  } else if (!autoFix) {
      console.log(`\n⚠️  Found ${missingRoles} missing role(s). Run \`npm run fix:iam\` to grant them automatically or add them manually in the Google Cloud Console.`);
  } else {
      console.log(`\n✅ Finished attempting to fix ${missingRoles} role(s).`);
  }

  console.log("\n✅ IAM verification complete.\n");
}

// Detect script type
try {
    const args = process.argv.slice(2);
    const autoFix = args.includes("--fix") || process.env.AUTO_FIX === "true";
    verifyAndFixRoles(autoFix);
} catch (error) {
    console.error("\nScript failed to complete. Please check the error messages above.");
    process.exit(1);
}
