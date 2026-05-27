import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pptxgen = require("C:/Users/Arnab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs/dist/pptxgen.cjs.js");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "DocSaathi Team";
pptx.company = "Techno Main Salt Lake";
pptx.subject = "Project Competition 2026";
pptx.title = "DocSaathi: Telemedicine & Smart Healthcare Platform";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};
pptx.defineLayout({ name: "CUSTOM_WIDE", width: 13.333, height: 7.5 });
pptx.layout = "CUSTOM_WIDE";
pptx.margin = 0;

const outPath = path.resolve("DocSaathi_TMSL_Project_Presentation.pptx");
const assets = {
  logo: path.resolve("public/logo.png"),
  hero: path.resolve("public/hero-duo.png"),
  heroNew: path.resolve("public/hero-new.png"),
};

const C = {
  navy: "11263C",
  ink: "172233",
  green: "0F8B6F",
  mint: "DDF5EC",
  lime: "A9D18E",
  gold: "F5C451",
  paper: "FBFCF8",
  white: "FFFFFF",
  gray: "667085",
  light: "EDF2F7",
  red: "D95D39",
};

function addFooter(slide, n) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0.55,
    y: 6.82,
    w: 11.65,
    h: 0,
    line: { color: C.light, width: 1 },
  });
  slide.addText(String(n), {
    x: 12.35,
    y: 6.65,
    w: 0.38,
    h: 0.32,
    fontFace: "Aptos",
    fontSize: 12,
    color: C.gray,
    bold: true,
    align: "right",
    margin: 0,
    fit: "shrink",
  });
}

function addTitle(slide, kicker, title, n) {
  slide.background = { color: C.paper };
  slide.addText(kicker, {
    x: 0.65,
    y: 0.43,
    w: 3.5,
    h: 0.22,
    fontFace: "Aptos",
    fontSize: 11,
    bold: true,
    color: C.green,
    charSpace: 1.4,
    margin: 0,
    breakLine: false,
  });
  slide.addText(title, {
    x: 0.65,
    y: 0.75,
    w: 11.2,
    h: 0.55,
    fontFace: "Aptos Display",
    fontSize: 25,
    bold: true,
    color: C.navy,
    margin: 0,
    fit: "shrink",
  });
  addFooter(slide, n);
}

function addPill(slide, text, x, y, w, color = C.mint, textColor = C.green) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.37,
    rectRadius: 0.07,
    fill: { color },
    line: { color, transparency: 100 },
  });
  slide.addText(text, {
    x: x + 0.14,
    y: y + 0.085,
    w: w - 0.28,
    h: 0.16,
    fontFace: "Aptos",
    fontSize: 8.5,
    bold: true,
    color: textColor,
    align: "center",
    margin: 0,
    fit: "shrink",
  });
}

function addBullet(slide, text, x, y, w, opts = {}) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x,
    y: y + 0.04,
    w: 0.09,
    h: 0.09,
    fill: { color: opts.dot || C.green },
    line: { color: opts.dot || C.green, transparency: 100 },
  });
  slide.addText(text, {
    x: x + 0.22,
    y,
    w,
    h: opts.h || 0.42,
    fontFace: "Aptos",
    fontSize: opts.size || 14,
    color: opts.color || C.ink,
    margin: 0,
    fit: "shrink",
    breakLine: false,
  });
}

function addCard(slide, x, y, w, h, title, body, accent = C.green) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    fill: { color: C.white },
    line: { color: "D9E4E0", width: 1 },
    shadow: { type: "outer", color: "BAC8C4", opacity: 0.13, blur: 1, angle: 45, distance: 1 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.08,
    h,
    fill: { color: accent },
    line: { color: accent, transparency: 100 },
  });
  slide.addText(title, {
    x: x + 0.28,
    y: y + 0.22,
    w: w - 0.45,
    h: 0.25,
    fontFace: "Aptos",
    fontSize: 14,
    bold: true,
    color: C.navy,
    margin: 0,
    fit: "shrink",
  });
  slide.addText(body, {
    x: x + 0.28,
    y: y + 0.62,
    w: w - 0.45,
    h: h - 0.78,
    fontFace: "Aptos",
    fontSize: 11.2,
    color: C.gray,
    margin: 0,
    breakLine: false,
    fit: "shrink",
  });
}

function addArrow(slide, x1, y1, x2, y2, color = C.green) {
  slide.addShape(pptx.ShapeType.line, {
    x: x1,
    y: y1,
    w: x2 - x1,
    h: y2 - y1,
    line: { color, width: 1.4, beginArrowType: "none", endArrowType: "triangle" },
  });
}

function addLogo(slide, x, y, w, h) {
  if (fs.existsSync(assets.logo)) {
    slide.addImage({ path: assets.logo, x, y, w, h });
  } else {
    slide.addText("DocSaathi", {
      x,
      y,
      w,
      h,
      fontFace: "Aptos Display",
      fontSize: 20,
      bold: true,
      color: C.green,
      margin: 0,
    });
  }
}

// Slide 1
{
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 1.05,
    fill: { color: C.navy },
    line: { color: C.navy, transparency: 100 },
  });
  slide.addText("TITLE  PAGE", {
    x: 0.65,
    y: 0.35,
    w: 2.2,
    h: 0.2,
    fontFace: "Aptos",
    fontSize: 12,
    bold: true,
    color: C.white,
    charSpace: 1.5,
    margin: 0,
  });
  slide.addText("PROJECT COMPETITION", {
    x: 7.55,
    y: 0.34,
    w: 2.7,
    h: 0.2,
    fontFace: "Aptos",
    fontSize: 12,
    bold: true,
    color: C.white,
    charSpace: 1.1,
    margin: 0,
    align: "right",
  });
  slide.addText("2026", {
    x: 10.35,
    y: 0.27,
    w: 1.0,
    h: 0.32,
    fontFace: "Aptos Display",
    fontSize: 21,
    bold: true,
    color: C.gold,
    margin: 0,
  });
  addLogo(slide, 0.7, 1.48, 1.05, 1.05);
  slide.addText("Department of Information Technology", {
    x: 1.95,
    y: 1.62,
    w: 4.7,
    h: 0.28,
    fontFace: "Aptos",
    fontSize: 15,
    color: C.gray,
    margin: 0,
  });
  slide.addText("Techno Main Salt Lake", {
    x: 1.95,
    y: 1.95,
    w: 4.0,
    h: 0.32,
    fontFace: "Aptos",
    fontSize: 17,
    bold: true,
    color: C.green,
    margin: 0,
  });
  slide.addText("Problem Statement Title -", {
    x: 0.75,
    y: 3.03,
    w: 3.2,
    h: 0.28,
    fontFace: "Aptos",
    fontSize: 15,
    color: C.gray,
    margin: 0,
  });
  slide.addText("DocSaathi: Telemedicine & Smart Healthcare Platform", {
    x: 0.75,
    y: 3.4,
    w: 6.45,
    h: 0.95,
    fontFace: "Aptos Display",
    fontSize: 30,
    bold: true,
    color: C.navy,
    margin: 0,
    fit: "shrink",
    breakLine: false,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.75,
    y: 4.63,
    w: 5.9,
    h: 0.04,
    fill: { color: C.gold },
    line: { color: C.gold, transparency: 100 },
  });
  slide.addText("Team Number - [Enter Team No.]   |   Team Name - [Enter Team Name]", {
    x: 0.78,
    y: 5.02,
    w: 6.6,
    h: 0.26,
    fontFace: "Aptos",
    fontSize: 13.5,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  slide.addText("Student Name - University Roll with Year of Registration", {
    x: 0.78,
    y: 5.42,
    w: 6.4,
    h: 0.25,
    fontFace: "Aptos",
    fontSize: 12.5,
    color: C.gray,
    margin: 0,
  });
  if (fs.existsSync(assets.hero)) {
    slide.addImage({ path: assets.hero, x: 7.65, y: 1.45, w: 4.75, h: 4.7 });
  } else {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.65,
      y: 1.55,
      w: 4.8,
      h: 4.35,
      fill: { color: C.mint },
      line: { color: "C7EADD" },
    });
    slide.addText("Patient + Doctor care loop", {
      x: 8.25,
      y: 3.45,
      w: 3.6,
      h: 0.4,
      fontFace: "Aptos Display",
      fontSize: 22,
      color: C.green,
      bold: true,
      align: "center",
      margin: 0,
    });
  }
}

// Slide 2
{
  const slide = pptx.addSlide();
  addTitle(slide, "DOCSAATHI", "Proposed Solution", 2);
  slide.addText("A secure web platform that connects patients, doctors and administrators across one digital healthcare workflow.", {
    x: 0.75,
    y: 1.62,
    w: 11.75,
    h: 0.62,
    fontFace: "Aptos Display",
    fontSize: 22,
    bold: true,
    color: C.ink,
    margin: 0,
    fit: "shrink",
  });
  addCard(slide, 0.75, 2.6, 3.75, 1.35, "Patient access", "AI symptom checker, specialist discovery, appointment booking, video consults and medical records in one place.", C.green);
  addCard(slide, 4.82, 2.6, 3.75, 1.35, "Doctor workflow", "Verified doctors manage slots, appointments, patient history, digital prescriptions and earnings from a dedicated dashboard.", C.gold);
  addCard(slide, 8.89, 2.6, 3.75, 1.35, "Admin control", "Credential verification, user management, transaction tracking and payout review keep the ecosystem trustworthy.", C.red);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.1,
    y: 4.58,
    w: 10.95,
    h: 1.05,
    rectRadius: 0.08,
    fill: { color: C.navy },
    line: { color: C.navy, transparency: 100 },
  });
  slide.addText("Core idea: reduce healthcare friction by moving triage, booking, consultation, records and follow-up into a single authenticated journey.", {
    x: 1.45,
    y: 4.92,
    w: 10.2,
    h: 0.28,
    fontFace: "Aptos",
    fontSize: 14,
    bold: true,
    color: C.white,
    align: "center",
    margin: 0,
    fit: "shrink",
  });
}

// Slide 3
{
  const slide = pptx.addSlide();
  addTitle(slide, "TECHNICAL APPROACH", "Architecture links AI triage, verified care and live consultation.", 3);
  slide.addText("Techstack", {
    x: 0.75,
    y: 1.55,
    w: 1.25,
    h: 0.26,
    fontFace: "Aptos",
    fontSize: 14,
    color: C.gray,
    bold: true,
    margin: 0,
  });
  addPill(slide, "Next.js 15", 2.0, 1.48, 1.25);
  addPill(slide, "PostgreSQL + Prisma", 3.42, 1.48, 1.85);
  addPill(slide, "Clerk Auth", 5.45, 1.48, 1.25);
  addPill(slide, "Vonage Video", 6.88, 1.48, 1.45);
  addPill(slide, "Groq AI", 8.52, 1.48, 1.05);
  addPill(slide, "Geoapify / OSM", 9.78, 1.48, 1.55);
  const y = 3.0;
  addCard(slide, 0.78, y, 2.05, 1.0, "Patient", "Symptoms, records, appointments", C.green);
  addCard(slide, 3.35, y, 2.05, 1.0, "AI Triage", "Groq-powered symptom analysis", C.gold);
  addCard(slide, 5.92, y, 2.05, 1.0, "Booking", "Specialty, slots, credits", C.green);
  addCard(slide, 8.49, y, 2.05, 1.0, "Video Call", "Vonage consultation room", C.red);
  addCard(slide, 11.06, y, 1.72, 1.0, "Records", "Notes and prescriptions", C.navy);
  addArrow(slide, 2.88, y + 0.5, 3.3, y + 0.5);
  addArrow(slide, 5.45, y + 0.5, 5.87, y + 0.5);
  addArrow(slide, 8.02, y + 0.5, 8.44, y + 0.5);
  addArrow(slide, 10.59, y + 0.5, 11.0, y + 0.5);
  slide.addText("Implementation", {
    x: 0.78,
    y: 4.72,
    w: 2.0,
    h: 0.26,
    fontFace: "Aptos",
    fontSize: 14,
    color: C.gray,
    bold: true,
    margin: 0,
  });
  addBullet(slide, "Role-based dashboards for patients, doctors and administrators", 0.82, 5.25, 5.6);
  addBullet(slide, "Server actions handle appointments, credits, records and doctor verification", 0.82, 5.78, 5.8);
  addBullet(slide, "Live video consultation plus post-visit prescription and history update", 6.85, 5.25, 5.1);
  addBullet(slide, "Nearby facilities and medicine search support urgent care decisions", 6.85, 5.78, 5.0);
}

// Slide 4
{
  const slide = pptx.addSlide();
  addTitle(slide, "FEASIBILITY AND VIABILITY", "The platform is buildable with available APIs, but adoption and privacy need careful handling.", 4);
  addCard(slide, 0.85, 1.75, 3.6, 1.4, "Technical feasibility", "The project uses production-ready web tools: Next.js App Router, Prisma models, Clerk authentication, Vonage video rooms and map APIs.", C.green);
  addCard(slide, 4.85, 1.75, 3.6, 1.4, "Operational viability", "Doctors can be onboarded through credential verification, schedule setup, appointment queues and payout workflows.", C.gold);
  addCard(slide, 8.85, 1.75, 3.6, 1.4, "User adoption risk", "Patients and doctors may need trust-building, simple onboarding and reliable support before shifting from offline habits.", C.red);
  addCard(slide, 1.48, 3.85, 4.75, 1.35, "Security and compliance focus", "The app must protect personal health data through authenticated access, careful record visibility and secure API configuration.", C.navy);
  addCard(slide, 7.05, 3.85, 4.75, 1.35, "Scalability path", "Cloud database, modular server actions and API-based video/AI services make the solution suitable for phased rollout.", C.green);
}

// Slide 5
{
  const slide = pptx.addSlide();
  addTitle(slide, "IMPACT AND BENEFITS", "DocSaathi makes first-contact healthcare faster, more traceable and easier to reach.", 5);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.78,
    y: 1.7,
    w: 3.55,
    h: 3.95,
    rectRadius: 0.08,
    fill: { color: C.navy },
    line: { color: C.navy, transparency: 100 },
  });
  slide.addText("For patients", {
    x: 1.08,
    y: 2.05,
    w: 2.8,
    h: 0.32,
    fontFace: "Aptos Display",
    fontSize: 20,
    color: C.white,
    bold: true,
    margin: 0,
  });
  slide.addText("Access care from home, understand symptoms early, find specialists and keep records organized after each visit.", {
    x: 1.08,
    y: 2.65,
    w: 2.8,
    h: 1.2,
    fontFace: "Aptos",
    fontSize: 14,
    color: "D9F5ED",
    margin: 0,
    fit: "shrink",
  });
  slide.addText("Primary value: convenience + continuity", {
    x: 1.08,
    y: 4.67,
    w: 2.8,
    h: 0.3,
    fontFace: "Aptos",
    fontSize: 12,
    bold: true,
    color: C.gold,
    margin: 0,
    fit: "shrink",
  });
  addCard(slide, 4.82, 1.7, 3.3, 1.22, "For doctors", "Less manual coordination, better patient context and a cleaner path from consultation to prescription.", C.green);
  addCard(slide, 8.68, 1.7, 3.3, 1.22, "For administrators", "Centralized verification, activity oversight, revenue tracking and payout management.", C.gold);
  addCard(slide, 4.82, 3.45, 3.3, 1.22, "For remote areas", "Location-aware discovery and video consultation reduce the dependency on nearby specialty clinics.", C.red);
  addCard(slide, 8.68, 3.45, 3.3, 1.22, "For institutions", "A complete demonstration of healthcare digitization using modern web, AI, maps and real-time communication.", C.navy);
}

// Slide 6
{
  const slide = pptx.addSlide();
  addTitle(slide, "RESEARCH AND REFERENCES", "Implementation choices are grounded in telemedicine, digital health and platform documentation.", 6);
  addBullet(slide, "World Health Organization, Global Strategy on Digital Health 2020-2025.", 0.9, 1.72, 10.5, { h: 0.36 });
  addBullet(slide, "World Health Organization, Telemedicine: Opportunities and Developments in Member States.", 0.9, 2.25, 10.5, { h: 0.36 });
  addBullet(slide, "Next.js documentation for App Router, server components and production deployment.", 0.9, 2.78, 10.5, { h: 0.36 });
  addBullet(slide, "Prisma documentation for PostgreSQL schema modeling and application data access.", 0.9, 3.31, 10.5, { h: 0.36 });
  addBullet(slide, "Clerk documentation for authentication and role-aware user management.", 0.9, 3.84, 10.5, { h: 0.36 });
  addBullet(slide, "Vonage Video API documentation for secure real-time consultation sessions.", 0.9, 4.37, 10.5, { h: 0.36 });
  addBullet(slide, "OpenStreetMap / Geoapify documentation for nearby healthcare facility discovery.", 0.9, 4.9, 10.5, { h: 0.36 });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.9,
    y: 5.72,
    w: 10.8,
    h: 0.55,
    rectRadius: 0.06,
    fill: { color: C.mint },
    line: { color: "C8EDE0" },
  });
  slide.addText("Project source: local DocSaathi repository, README, Prisma schema, app routes, components and server actions.", {
    x: 1.15,
    y: 5.91,
    w: 10.3,
    h: 0.16,
    fontFace: "Aptos",
    fontSize: 11,
    bold: true,
    color: C.green,
    margin: 0,
    fit: "shrink",
  });
}

await pptx.writeFile({ fileName: outPath });
console.log(outPath);
