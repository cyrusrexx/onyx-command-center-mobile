# Onyx Record Press — Command Center

Executive & operational dashboard for Onyx Record Press, a vinyl record pressing facility in Arcadia, CA running automated Pheenix Alpha AD12 presses.

![Command Center](https://img.shields.io/badge/Status-Demo%20%2F%20Mockup-00e5ff?style=flat-square)

## Pages

| Page | Description |
|------|-------------|
| **Command Center** | KPIs, Revenue vs COGS, AR Aging, Cash Flow Forecast, Job Profitability, Pipeline |
| **Job Pipeline** | All active jobs with status, deposits, production location, regrind eligibility |
| **Press Control** | Live AD12 monitoring — cycle count, press parameters, extruder temps, environmental sensors |
| **Environment** | 24-hour sensor history — temperature, humidity, chiller, hydraulic oil |
| **Financial** | P&L, cash position, 15-day projection, AR/AP aging, job-level profitability |
| **Maintenance** | Schedule (daily → annual), spare parts inventory, maintenance log |
| **Inventory** | Raw material levels, purchase orders, vendor directory |

## Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **Backend:** Express.js (in-memory mock data)
- **Build:** Vite + esbuild

## AD12 Press Defaults (from Pheenix operational manual)

| Parameter | Value |
|-----------|-------|
| Extruder Bottom / Middle / Top | 135°C |
| Extruder Nozzle | 125°C |
| H1 Heating | 3.0s |
| H2 Heating | 6.5s |
| Cooling | 9.0s |
| Opening Delay | 1.0s |
| Ram Pressure | 175 bar |
| Ram Pos Heating Stop | 99 mm |

## Integrations (planned)

- **QuickBooks** — accounting, P&L, AR/AP sync
- **Monday.com** — project/job tracking
- **Gmail / Google Docs** — client communications
- **Slack** — internal team notifications
- **Environmental Sensors** — real-time temperature, humidity, chiller monitoring

## Running Locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5000`.

## Building for Production

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## License

Proprietary — Onyx Record Press. All rights reserved.
