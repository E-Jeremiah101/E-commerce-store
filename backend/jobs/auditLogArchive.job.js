import cron from "node-cron";
import { AuditLogArchiveService } from "../service/auditLogArchive.js";
class AuditLogArchiveJob {
  constructor() {
    this.archiveService = new AuditLogArchiveService();
    this.isRunning = false;
  }

  /**
   * Schedule the archive job to run on the 1st day of every month at 2 AM
   */
  scheduleMonthlyArchive() {
    // Runs at 2 AM on the 1st day of every month
    cron.schedule("0 2 1 * *", async () => {
      await this.runArchiveJob();
    });

    console.log(
      "Audit log archive job scheduled: Runs on 1st of every month at 2 AM"
    );
  }

  /**
   * Run the archive job manually
   */
  async runArchiveJob() {
    if (this.isRunning) {
      console.log("Archive job already running");
      return;
    }

    this.isRunning = true;

    try {
      console.log("Starting audit log archive job...");

      const result = await this.archiveService.archiveOldLogs(true);

      console.log("Archive job completed:", result.message);

      // Optional: Send notification
      await this.sendArchiveNotification(result);
    } catch (error) {
      console.error("Archive job failed:", error);

      // Optional: Send error notification
      await this.sendErrorNotification(error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Send success notification (implement based on your notification system)
   */
  async sendArchiveNotification(result) {
    // Example: Send email to admins
    // await emailService.send({
    //   to: adminEmails,
    //   subject: "Audit Log Archive Completed",
    //   html: `<p>Archived ${result.totalLogs} logs from ${result.periodStart} to ${result.periodEnd}</p>`
    // });

    console.log("Archive notification would be sent here");
  }

  /**
   * Send error notification
   */
  async sendErrorNotification(error) {
    // Example: Send error email
    // await emailService.send({
    //   to: adminEmails,
    //   subject: "Audit Log Archive Failed",
    //   html: `<p>Archive job failed: ${error.message}</p>`
    // });

    console.log("Error notification would be sent here");
  }

  /**
   * Check if archiving is needed (for manual trigger)
   */
  async checkArchiveNeeded() {
    return await this.archiveService.checkArchiveStatus();
  }
}

export default new AuditLogArchiveJob();
