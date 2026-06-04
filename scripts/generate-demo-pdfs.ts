/**
 * Converts the markdown files in ./demo-documents into simple PDFs (same folder),
 * so you can upload real PDFs into the app for the demo.
 *
 * Run with: `npm run demo:pdfs`
 */
import { promises as fs } from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const DEMO_DIR = path.resolve(process.cwd(), "demo-documents");

async function mdToPdf(mdPath: string, pdfPath: string): Promise<void> {
  const md = await fs.readFile(mdPath, "utf8");
  const doc = new PDFDocument({ margin: 56, size: "A4" });
  const stream = doc.pipe(require("fs").createWriteStream(pdfPath));

  for (const rawLine of md.split("\n")) {
    const line = rawLine.replace(/\*\*/g, "");
    if (line.startsWith("# ")) {
      doc.moveDown(0.5).fontSize(20).font("Helvetica-Bold").text(line.slice(2));
    } else if (line.startsWith("## ")) {
      doc.moveDown(0.5).fontSize(14).font("Helvetica-Bold").text(line.slice(3));
    } else if (line.trim() === "") {
      doc.moveDown(0.4);
    } else {
      doc.fontSize(11).font("Helvetica").text(line);
    }
  }

  doc.end();
  await new Promise<void>((resolve) => stream.on("finish", () => resolve()));
}

async function main() {
  const entries = await fs.readdir(DEMO_DIR);
  const mdFiles = entries.filter((f) => f.endsWith(".md"));
  for (const md of mdFiles) {
    const pdf = md.replace(/\.md$/, ".pdf");
    await mdToPdf(path.join(DEMO_DIR, md), path.join(DEMO_DIR, pdf));
    console.log(`✅ ${pdf}`);
  }
  console.log("\nDone. Upload these PDFs as the admin user, then run the worker.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
