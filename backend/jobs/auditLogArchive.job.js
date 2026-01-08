import cron from "node-cron";
import { AuditLogArchiveService } from "../service/auditLogArchive.js";
class AuditLogArchiveJob {
  constructor() {
    this.archiveService = new AuditLogArchiveService();
    this.isRunning = false;
  }

  scheduleMonthlyArchive() {

    // Runs at 2 AM on the 1st day of every month
    cron.schedule("0 2 1 * *", async () => {
      await this.runArchiveJob();
    });

    console.log(
      "Audit log archive job scheduled: Runs on 1st of every month at 2 AM"
    );
  }


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

    } catch (error) {
      console.error("Archive job failed:", error);

    } finally {
      this.isRunning = false;
    }
  }


 
  async checkArchiveNeeded() {
    return await this.archiveService.checkArchiveStatus();
  }
}

export default new AuditLogArchiveJob();
