import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import ExcelJS from "exceljs";
import type { Config } from "../config.js";
import type { ActivityChunk } from "../reference/schemas/strava.js";

/**
 * Service to track which activities have been synced to Pinecone,
 * had embeddings created, and were provided to the LLM.
 */
export class ActivityTracker {
  private excelPath: string;
  private workbook: ExcelJS.Workbook | null = null;
  private worksheet: ExcelJS.Worksheet | null = null;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    // Store tracking file in the user's data directory
    const dataDir = config.dataDir || "";
    this.excelPath = join(dataDir, "activity-tracking.xlsx");

    // Ensure data directory exists
    if (dataDir) {
      try {
        mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        // Directory might already exist
        if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
          console.warn(`Could not create data directory ${dataDir}:`, err);
        }
      }
    }

    this.initializeTracker();
  }

  /**
   * Initialize the Excel tracker - load existing file or create new one
   */
  private initializeTracker(): void {
    try {
      if (existsSync(this.excelPath)) {
        // Load existing file
        this.workbook = new ExcelJS.Workbook();
        this.workbook.xlsx.readFile(this.excelPath);
        this.worksheet = this.workbook.getWorksheet("Activities");

        if (!this.worksheet) {
          // Create worksheet if it doesn't exist
          this.worksheet = this.workbook.addWorksheet("Activities");
          this.setupWorksheetColumns();
        }
      } else {
        // Create new workbook
        this.workbook = new ExcelJS.Workbook();
        this.worksheet = this.workbook.addWorksheet("Activities");
        this.setupWorksheetColumns();
      }
    } catch (error) {
      console.error("Failed to initialize activity tracker:", error);
      // Create a minimal fallback
      this.workbook = new ExcelJS.Workbook();
      this.worksheet = this.workbook.addWorksheet("Activities");
      this.setupWorksheetColumns();
    }
  }

  /**
   * Set up the worksheet columns for tracking
   */
  private setupWorksheetColumns(): void {
    if (!this.worksheet) return;

    this.worksheet.columns = [
      { header: "Activity ID", key: "activityId", width: 20 },
      { header: "Activity Name", key: "name", width: 30 },
      { header: "Sport Type", key: "sportType", width: 15 },
      { header: "Start Date", key: "startDate", width: 20 },
      { header: "Distance (km)", key: "distanceKm", width: 15 },
      { header: "Time (min)", key: "timeMin", width: 15 },
      { header: "Moving Time (min)", key: "movingTimeMin", width: 15 },
      { header: "Elapsed Time (min)", key: "elapsedTimeMin", width: 15 },
      { header: "Average Power (W)", key: "avgPower", width: 15 },
      { header: "Max Power (W)", key: "maxPower", width: 15 },
      { header: "Average HR (bpm)", key: "avgHR", width: 15 },
      { header: "Max HR (bpm)", key: "maxHR", width: 15 },
      { header: "Elevation Gain (m)", key: "elevationGain", width: 15 },
      { header: "Average Cadence", key: "avgCadence", width: 15 },
      { header: "Average Speed (km/h)", key: "avgSpeed", width: 15 },
      { header: "Kilojoules", key: "kilojoules", width: 15 },
      { header: "Description", key: "description", width: 50 },
      { header: "Summary Text", key: "summary", width: 100 },
      { header: "Synced to Pinecone", key: "pineconeSyncedAt", width: 25 },
      { header: "Embeddings Created", key: "embeddingsCreatedAt", width: 25 },
      { header: "Provided to LLM", key: "llmProvidedAt", width: 25 },
    ];

    // Add header styling
    const headerRow = this.worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCCCCCC" }
    };
  }

  /**
   * Track that an activity has been synced to Pinecone and embeddings created
   */
  async trackActivitySync(activity: ActivityChunk): Promise<void> {
    try {
      if (!this.worksheet) {
        await this.initializeTracker();
      }

      // Check if we already have a record for this activity ID
      let row = this.findRowByActivityId(activity.id.toString());
      const isNew = !row;

      if (isNew) {
        // Add new row
        row = this.worksheet.addRow({});
      }

      // Update the row with activity data
      row.getCell("activityId").value = activity.id.toString();
      row.getCell("name").value = activity.name || "";
      row.getCell("sportType").value = activity.sportType || "";
      row.getCell("startDate").value = activity.startDateLocal || "";
      row.getCell("distanceKm").value = (activity.distance || 0) / 1000; // Convert meters to km
      row.getCell("timeMin").value = Math.round((activity.movingTime || 0) / 60);
      row.getCell("movingTimeMin").value = Math.round((activity.movingTime || 0) / 60);
      row.getCell("elapsedTimeMin").value = Math.round((activity.elapsedTime || 0) / 60);
      row.getCell("avgPower").value = activity.averagePower || null;
      row.getCell("maxPower").value = activity.maxPower || null;
      row.getCell("avgHR").value = activity.averageHeartRate || null;
      row.getCell("maxHR").value = activity.maxHeartRate || null;
      row.getCell("elevationGain").value = activity.totalElevationGain || null;
      row.getCell("avgCadence").value = activity.averageCadence || null;
      row.getCell("avgSpeed").value = ((activity.averageSpeed || 0) * 3.6).toFixed(2); // m/s to km/h
      row.getCell("kilojoules").value = activity.kilojoules || null;
      row.getCell("description").value = activity.description || "";
      row.getCell("summary").value = activity.summary || "";

      // Set timestamps for sync and embeddings (they happen together in this flow)
      const now = new Date().toISOString();
      row.getCell("pineconeSyncedAt").value = now;
      row.getCell("embeddingsCreatedAt").value = now;

      // Save the workbook
      await this.saveWorkbook();

      console.log(`Tracked activity ${activity.id} ${isNew ? "added" : "updated"} in tracking sheet`);
    } catch (error) {
      console.error("Failed to track activity sync:", error);
    }
  }

  /**
   * Track that an activity was provided to the LLM (for context)
   */
  async trackLLMUsage(activityId: number): Promise<void> {
    try {
      if (!this.worksheet) {
        await this.initializeTracker();
      }

      const row = this.findRowByActivityId(activityId.toString());
      if (row) {
        row.getCell("llmProvidedAt").value = new Date().toISOString();
        await this.saveWorkbook();
        console.log(`Marked activity ${activityId} as provided to LLM`);
      }
    } catch (error) {
      console.error("Failed to track LLM usage:", error);
    }
  }

  /**
   * Find a row by activity ID
   */
  private findRowByActivityId(activityId: string): ExcelJS.Row | undefined {
    if (!this.worksheet) return undefined;

    return this.worksheet.getRows().find(row => {
      const cellValue = row.getCell("activityId").value;
      return cellValue !== null && cellValue !== undefined && cellValue.toString() === activityId;
    });
  }

  /**
   * Save the workbook to file
   */
  private async saveWorkbook(): Promise<void> {
    if (!this.workbook) return;

    try {
      await this.workbook.xlsx.writeFile(this.excelPath);
    } catch (error) {
      console.error("Failed to save activity tracker workbook:", error);
      throw error;
    }
  }

  /**
   * Get statistics about tracked activities
   */
  async getStats(): Promise<{
    total: number;
    syncedToPinecone: number;
    embeddingsCreated: number;
    providedToLLM: number;
  }> {
    try {
      if (!this.worksheet) {
        await this.initializeTracker();
      }

      const rows = this.worksheet.getRows();
      const total = rows.length - 1; // Subtract header row

      const syncedToPinecone = rows.filter(row =>
        row.getCell("pineconeSyncedAt").value !== null &&
        row.getCell("pineconeSyncedAt").value !== undefined
      ).length - 1; // Subtract header if counted

      const embeddingsCreated = rows.filter(row =>
        row.getCell("embeddingsCreatedAt").value !== null &&
        row.getCell("embeddingsCreatedAt").value !== undefined
      ).length - 1; // Subtract header if counted

      const providedToLLM = rows.filter(row =>
        row.getCell("llmProvidedAt").value !== null &&
        row.getCell("llmProvidedAt").value !== undefined
      ).length - 1; // Subtract header if counted

      return {
        total: Math.max(0, total),
        syncedToPinecone: Math.max(0, syncedToPinecone),
        embeddingsCreated: Math.max(0, embeddingsCreated),
        providedToLLM: Math.max(0, providedToLLM)
      };
    } catch (error) {
      console.error("Failed to get tracker stats:", error);
      return { total: 0, syncedToPinecone: 0, embeddingsCreated: 0, providedToLLM: 0 };
    }
  }
}