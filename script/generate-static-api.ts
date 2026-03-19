/**
 * Generate static JSON files from the in-memory storage
 * so the app can run as a fully static site on GitHub Pages.
 * Mirrors exactly what the Express routes return.
 */
import { MemStorage } from "../server/storage";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const storage = new MemStorage();

async function generate() {
  const outDir = join(process.cwd(), "dist", "public", "api");
  mkdirSync(outDir, { recursive: true });

  // Simple list endpoints
  const jobs = await storage.getJobs();
  const productionRuns = await storage.getProductionRuns();
  const financials = await storage.getFinancials();
  const maintenance = await storage.getMaintenanceTasks();
  const sensors = await storage.getSensorReadings();
  const inventory = await storage.getInventory();
  const arAging = await storage.getArAging();

  const writeJson = (name: string, data: any) => {
    writeFileSync(join(outDir, name), JSON.stringify(data));
    console.log(`  ✓ api/${name} (${Array.isArray(data) ? data.length + " records" : "object"})`);
  };

  writeJson("jobs.json", jobs);
  writeJson("production-runs.json", productionRuns);
  writeJson("financials.json", financials);
  writeJson("maintenance.json", maintenance);
  writeJson("sensors.json", sensors);
  writeJson("inventory.json", inventory);
  writeJson("ar-aging.json", arAging);

  const shipments = await storage.getShipments();
  writeJson("shipments.json", shipments);

  const leads = await storage.getLeads();
  writeJson("leads.json", leads);

  const vendors = await storage.getVendors();
  writeJson("vendors.json", vendors);

  const pressLogs = await storage.getPressLogs();
  writeJson("press-logs.json", pressLogs);

  // Computed dashboard-summary (mirrors server/routes.ts logic)
  const janFinancial = financials.find((f: any) => f.period === "2026-01");
  const latestFinancial = janFinancial || financials[financials.length - 1];
  const prevFinancial = financials.find((f: any) => f.period === "2025-12") || (financials.length > 1 ? financials[financials.length - 2] : null);
  const activeJobs = jobs.filter((j: any) => !["delivered", "closed"].includes(j.status));
  
  const arBuckets: Record<string, number> = {
    current: arAging.filter((a: any) => a.agingBucket === "current").reduce((s: number, a: any) => s + a.amount, 0),
    "1-30": arAging.filter((a: any) => a.agingBucket === "1-30").reduce((s: number, a: any) => s + a.amount, 0),
    "31-60": arAging.filter((a: any) => a.agingBucket === "31-60").reduce((s: number, a: any) => s + a.amount, 0),
    "61-90": arAging.filter((a: any) => a.agingBucket === "61-90").reduce((s: number, a: any) => s + a.amount, 0),
    "91+": arAging.filter((a: any) => a.agingBucket === "91+").reduce((s: number, a: any) => s + a.amount, 0),
  };

  writeJson("dashboard-summary.json", {
    revenue: (latestFinancial as any)?.revenue ?? 0,
    prevRevenue: (prevFinancial as any)?.revenue ?? 0,
    cashPosition: (latestFinancial as any)?.cashPosition ?? 0,
    activeJobCount: activeJobs.length,
    pressUtilization: 67,
    rejectRate: 3.2,
    financials,
    arBuckets,
    arTotal: arAging.reduce((s: number, a: any) => s + a.amount, 0),
    jobs: activeJobs,
  });

  console.log("\n✅ Static API files generated for GitHub Pages.");
}

generate();
