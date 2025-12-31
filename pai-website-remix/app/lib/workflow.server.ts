import cron from "node-cron";

let workflowInitialized = false;
let scheduledTask: cron.ScheduledTask | null = null;

// Get cron schedule from environment or use default (5:00 PM daily)
const WORKFLOW_CRON_SCHEDULE = process.env.WORKFLOW_CRON_SCHEDULE || "0 17 * * *";
const WORKFLOW_ENABLED = process.env.WORKFLOW_ENABLED !== "false"; // Enabled by default

export async function initializeWorkflows() {
  // Only initialize once
  if (workflowInitialized) {
    return;
  }

  if (!WORKFLOW_ENABLED) {
    //console.log("⚠️  Workflows disabled (WORKFLOW_ENABLED=false)");
    return;
  }

  try {
    // Validate cron expression
    if (!cron.validate(WORKFLOW_CRON_SCHEDULE)) {
      console.error(`❌ Invalid cron expression: ${WORKFLOW_CRON_SCHEDULE}`);
      return;
    }

    // Dynamic import to avoid loading workflow code in client bundle
    const { notifyPendingRequests } = await import("../../workflows/pending-requests-notifier");

    // Schedule the pending requests notification workflow
    scheduledTask = cron.schedule(WORKFLOW_CRON_SCHEDULE, async () => {
      console.log("\n" + "=".repeat(60));
      console.log("🔔 Workflow Triggered: Pending Requests Notification");
      console.log("=".repeat(60));
      
      try {
        await notifyPendingRequests();
        console.log("=".repeat(60));
        console.log("✅ Workflow completed successfully");
        console.log("=".repeat(60) + "\n");
      } catch (error) {
        console.error("=".repeat(60));
        console.error("❌ Workflow failed with error:");
        console.error(error);
        console.error("=".repeat(60) + "\n");
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata" // Indian timezone
    });

    workflowInitialized = true;

    console.log("\n" + "=".repeat(60));
    console.log("✅ Workflow scheduler initialized successfully");
    console.log(`📅 Schedule: ${WORKFLOW_CRON_SCHEDULE}`);
    console.log(`🌍 Timezone: Asia/Kolkata (IST)`);
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Failed to initialize workflows:", error);
  }
}

// Cleanup function for graceful shutdown
export function stopWorkflows() {
  if (scheduledTask) {
    scheduledTask.stop();
    console.log("🛑 Workflow scheduler stopped");
    workflowInitialized = false;
    scheduledTask = null;
  }
}
