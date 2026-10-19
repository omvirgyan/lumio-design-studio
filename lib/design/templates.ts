import { circle, ellipse, line, path, rect, regularPolygon, SHAPE_PATHS, star, text, triangle } from "./builders";
import { newPageId, type DesignDoc, type PageBackground, type SerializedObject } from "./types";

export type TemplatePage = { background: PageBackground; objects: SerializedObject[] };

export type Template = {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  tags: string[];
  pages: TemplatePage[];
};

const grad = (angle: number, ...colors: string[]): PageBackground => ({
  type: "linear",
  angle,
  stops: colors.map((color, i) => ({ offset: i / (colors.length - 1), color })),
});

export const TEMPLATES: Template[] = [
  {
    id: "summer-sale",
    name: "Summer Sale",
    category: "Instagram Post",
    width: 1080,
    height: 1080,
    tags: ["sale", "promo", "retail", "summer"],
    pages: [
      {
        background: "#FFF4E0",
        objects: [
          circle(860, 220, 300, "#FFB347", { name: "Sun" }),
          circle(180, 940, 220, "#FF7A59", { opacity: 0.85 }),
          text(90, 300, 900, "SUMMER", { fontSize: 190, fontFamily: "Bebas Neue", fill: "#1F2A44", charSpacing: 60 }),
          text(90, 480, 900, "SALE", { fontSize: 300, fontFamily: "Bebas Neue", fill: "#FF5A36" }),
          rect(90, 820, 420, 96, "#1F2A44", { radius: 48 }),
          text(90, 846, 420, "UP TO 50% OFF", { fontSize: 40, fontFamily: "Montserrat", fontWeight: "bold", fill: "#FFFFFF", align: "center", charSpacing: 80 }),
          text(560, 850, 440, "This weekend only · shop.example", { fontSize: 28, fontFamily: "Inter", fill: "#1F2A44" }),
        ],
      },
    ],
  },
  {
    id: "minimal-quote",
    name: "Minimal Quote",
    category: "Instagram Post",
    width: 1080,
    height: 1080,
    tags: ["quote", "minimal", "inspiration"],
    pages: [
      {
        background: "#F5F1EA",
        objects: [
          text(120, 160, 840, "“", { fontSize: 260, fontFamily: "Playfair Display", fill: "#C08552", align: "center" }),
          text(140, 420, 800, "Make it simple,\nbut significant.", { fontSize: 84, fontFamily: "Playfair Display", fill: "#2B2B2B", align: "center", lineHeight: 1.15 }),
          line(440, 740, 640, 740, "#C08552", 3),
          text(140, 790, 800, "— A GOOD DESIGNER", { fontSize: 30, fontFamily: "Montserrat", fill: "#6B6B6B", align: "center", charSpacing: 200 }),
        ],
      },
    ],
  },
  {
    id: "launch-story",
    name: "Product Launch",
    category: "Instagram Story",
    width: 1080,
    height: 1920,
    tags: ["launch", "tech", "app", "story"],
    pages: [
      {
        background: grad(160, "#1B1464", "#6A3093", "#E94E77"),
        objects: [
          circle(900, 300, 360, "#FFFFFF", { opacity: 0.08 }),
          circle(160, 1500, 420, "#FFFFFF", { opacity: 0.06 }),
          text(100, 260, 880, "INTRODUCING", { fontSize: 44, fontFamily: "Space Grotesk", fill: "#FFD6E0", charSpacing: 300 }),
          text(100, 360, 880, "Nova\nApp 2.0", { fontSize: 190, fontFamily: "Space Grotesk", fontWeight: "bold", fill: "#FFFFFF", lineHeight: 0.95 }),
          rect(100, 900, 880, 560, "#FFFFFF", { radius: 48, opacity: 0.12 }),
          text(160, 970, 760, "Faster sync\nSmarter search\nDark mode everywhere", { fontSize: 64, fontFamily: "Inter", fill: "#FFFFFF", lineHeight: 1.5 }),
          rect(100, 1620, 880, 140, "#FFFFFF", { radius: 70 }),
          text(100, 1660, 880, "Swipe up to try it", { fontSize: 52, fontFamily: "Inter", fontWeight: "bold", fill: "#6A3093", align: "center" }),
        ],
      },
    ],
  },
  {
    id: "pitch-deck",
    name: "Startup Pitch",
    category: "Presentation",
    width: 1920,
    height: 1080,
    tags: ["presentation", "pitch", "business", "slides"],
    pages: [
      {
        background: "#0F172A",
        objects: [
          rect(0, 0, 760, 1080, "#2563EB"),
          circle(760, 540, 260, "#0F172A"),
          circle(760, 540, 180, "#F59E0B"),
          text(1060, 330, 760, "Brightpath", { fontSize: 120, fontFamily: "Poppins", fontWeight: "bold", fill: "#FFFFFF" }),
          text(1060, 500, 760, "Making local energy\naffordable for everyone.", { fontSize: 52, fontFamily: "Inter", fill: "#CBD5E1", lineHeight: 1.3 }),
          text(1060, 760, 760, "SEED ROUND · 2026", { fontSize: 30, fontFamily: "Inter", fontWeight: "bold", fill: "#F59E0B", charSpacing: 200 }),
        ],
      },
      {
        background: "#FFFFFF",
        objects: [
          text(140, 120, 1640, "The problem", { fontSize: 96, fontFamily: "Poppins", fontWeight: "bold", fill: "#0F172A" }),
          rect(140, 300, 500, 560, "#EFF6FF", { radius: 32 }),
          rect(710, 300, 500, 560, "#EFF6FF", { radius: 32 }),
          rect(1280, 300, 500, 560, "#EFF6FF", { radius: 32 }),
          text(200, 380, 380, "42%", { fontSize: 120, fontFamily: "Poppins", fontWeight: "bold", fill: "#2563EB" }),
          text(200, 560, 380, "of households\noverpay for energy", { fontSize: 40, fontFamily: "Inter", fill: "#334155", lineHeight: 1.3 }),
          text(770, 380, 380, "3×", { fontSize: 120, fontFamily: "Poppins", fontWeight: "bold", fill: "#2563EB" }),
          text(770, 560, 380, "price swings\nsince 2020", { fontSize: 40, fontFamily: "Inter", fill: "#334155", lineHeight: 1.3 }),
          text(1340, 380, 380, "0", { fontSize: 120, fontFamily: "Poppins", fontWeight: "bold", fill: "#2563EB" }),
          text(1340, 560, 380, "tools built for\nrenters today", { fontSize: 40, fontFamily: "Inter", fill: "#334155", lineHeight: 1.3 }),
        ],
      },
      {
        background: "#2563EB",
        objects: [
          text(140, 380, 1640, "Thank you", { fontSize: 160, fontFamily: "Poppins", fontWeight: "bold", fill: "#FFFFFF", align: "center" }),
          text(140, 620, 1640, "hello@brightpath.example", { fontSize: 48, fontFamily: "Inter", fill: "#DBEAFE", align: "center" }),
        ],
      },
    ],
  },
  {
    id: "yt-tutorial",
    name: "Tutorial Thumbnail",
    category: "YouTube Thumbnail",
    width: 1280,
    height: 720,
    tags: ["youtube", "video", "thumbnail", "tutorial"],
    pages: [
      {
        background: "#FFE14D",
        objects: [
          rect(0, 520, 1280, 200, "#111111"),
          star(1080, 180, 140, "#FF3B30", { angle: 12 }),
          text(1000, 140, 160, "NEW", { fontSize: 56, fontFamily: "Bebas Neue", fill: "#FFFFFF", align: "center", angle: 12 }),
          text(70, 80, 900, "LEARN\nCSS GRID", { fontSize: 190, fontFamily: "Bebas Neue", fill: "#111111", lineHeight: 0.9 }),
          text(70, 565, 1140, "IN 10 MINUTES", { fontSize: 110, fontFamily: "Bebas Neue", fill: "#FFE14D", charSpacing: 40 }),
        ],
      },
    ],
  },
  {
    id: "event-poster",
    name: "Jazz Night Poster",
    category: "Poster",
    width: 1800,
    height: 2400,
    tags: ["event", "music", "poster", "concert"],
    pages: [
      {
        background: "#14213D",
        objects: [
          circle(900, 900, 640, "#FCA311"),
          circle(900, 900, 460, "#14213D"),
          circle(900, 900, 300, "#E5E5E5", { opacity: 0.12 }),
          text(150, 1640, 1500, "JAZZ NIGHT", { fontSize: 260, fontFamily: "Oswald", fontWeight: "bold", fill: "#FFFFFF", align: "center", charSpacing: 80 }),
          text(150, 1960, 1500, "FRIDAY · 9 PM · THE BLUE ROOM", { fontSize: 72, fontFamily: "Oswald", fill: "#FCA311", align: "center", charSpacing: 120 }),
          text(150, 2140, 1500, "Live quartet · Free entry before 10", { fontSize: 52, fontFamily: "Inter", fill: "#E5E5E5", align: "center" }),
        ],
      },
    ],
  },
  {
    id: "business-card-classic",
    name: "Classic Business Card",
    category: "Business Card",
    width: 1050,
    height: 600,
    tags: ["business", "card", "contact", "professional"],
    pages: [
      {
        background: "#FFFFFF",
        objects: [
          rect(0, 0, 18, 600, "#0E7C66"),
          text(90, 150, 800, "Alex Morgan", { fontSize: 72, fontFamily: "Playfair Display", fontWeight: "bold", fill: "#1A1A1A" }),
          text(90, 250, 800, "Landscape Architect", { fontSize: 34, fontFamily: "Inter", fill: "#0E7C66", charSpacing: 60 }),
          line(90, 330, 360, 330, "#D0D5D3", 2),
          text(90, 370, 800, "+1 (555) 014-2290\nalex@greenline.example\ngreenline.example", { fontSize: 28, fontFamily: "Inter", fill: "#4A4A4A", lineHeight: 1.5 }),
        ],
      },
      {
        background: "#0E7C66",
        objects: [
          regularPolygon(525, 260, 90, 6, "#FFFFFF", { opacity: 0.95 }),
          text(225, 400, 600, "GREENLINE STUDIO", { fontSize: 40, fontFamily: "Montserrat", fontWeight: "bold", fill: "#FFFFFF", align: "center", charSpacing: 300 }),
        ],
      },
    ],
  },
  {
    id: "bakery-flyer",
    name: "Bakery Opening Flyer",
    category: "Flyer",
    width: 1275,
    height: 1650,
    tags: ["flyer", "food", "bakery", "opening"],
    pages: [
      {
        background: "#FBEDE3",
        objects: [
          path(637, 470, 760, 640, SHAPE_PATHS.arch, "#E8A87C"),
          circle(637, 520, 170, "#FBEDE3"),
          star(637, 520, 110, "#E8A87C", { points: 8, inner: 80 }),
          text(100, 880, 1075, "Grand Opening", { fontSize: 130, fontFamily: "Dancing Script", fontWeight: "bold", fill: "#7A3E2A", align: "center" }),
          text(100, 1060, 1075, "MAPLE & CRUMB BAKERY", { fontSize: 54, fontFamily: "Montserrat", fontWeight: "bold", fill: "#3D2B1F", align: "center", charSpacing: 200 }),
          rect(287, 1200, 700, 4, "#7A3E2A"),
          text(100, 1250, 1075, "Saturday, June 6 · 8 AM\nFree coffee for the first 50 guests", { fontSize: 44, fontFamily: "Inter", fill: "#3D2B1F", align: "center", lineHeight: 1.5 }),
        ],
      },
    ],
  },
  {
    id: "resume-clean",
    name: "Clean Resume",
    category: "Document",
    width: 1240,
    height: 1754,
    tags: ["resume", "cv", "document", "career"],
    pages: [
      {
        background: "#FFFFFF",
        objects: [
          rect(0, 0, 1240, 300, "#1E293B"),
          text(90, 90, 1060, "JORDAN LEE", { fontSize: 88, fontFamily: "Montserrat", fontWeight: "bold", fill: "#FFFFFF", charSpacing: 120 }),
          text(90, 200, 1060, "Product Designer · Berlin · jordan@lee.example", { fontSize: 30, fontFamily: "Inter", fill: "#CBD5E1" }),
          text(90, 380, 1060, "EXPERIENCE", { fontSize: 32, fontFamily: "Montserrat", fontWeight: "bold", fill: "#2563EB", charSpacing: 200 }),
          text(90, 450, 1060, "Senior Product Designer — Fieldnote (2022–now)", { fontSize: 34, fontFamily: "Inter", fontWeight: "bold", fill: "#0F172A" }),
          text(90, 505, 1060, "Led the redesign of the mobile editor, raising weekly retention by 18%.\nBuilt and maintained a cross-platform design system.", { fontSize: 28, fontFamily: "Inter", fill: "#475569", lineHeight: 1.5 }),
          text(90, 660, 1060, "Product Designer — Orbit Labs (2019–2022)", { fontSize: 34, fontFamily: "Inter", fontWeight: "bold", fill: "#0F172A" }),
          text(90, 715, 1060, "Shipped onboarding flows for 2M users. Ran weekly usability studies.", { fontSize: 28, fontFamily: "Inter", fill: "#475569", lineHeight: 1.5 }),
          text(90, 860, 1060, "SKILLS", { fontSize: 32, fontFamily: "Montserrat", fontWeight: "bold", fill: "#2563EB", charSpacing: 200 }),
          text(90, 930, 1060, "Interaction design · Prototyping · Research · Accessibility · Design systems", { fontSize: 28, fontFamily: "Inter", fill: "#475569" }),
          text(90, 1060, 1060, "EDUCATION", { fontSize: 32, fontFamily: "Montserrat", fontWeight: "bold", fill: "#2563EB", charSpacing: 200 }),
          text(90, 1130, 1060, "B.A. Communication Design — University of the Arts", { fontSize: 28, fontFamily: "Inter", fill: "#475569" }),
        ],
      },
    ],
  },
  {
    id: "brand-logo",
    name: "Monogram Logo",
    category: "Logo",
    width: 1000,
    height: 1000,
    tags: ["logo", "brand", "monogram"],
    pages: [
      {
        background: "#FFFFFF",
        objects: [
          circle(500, 420, 230, "#111827"),
          text(270, 300, 460, "K", { fontSize: 240, fontFamily: "Playfair Display", fontWeight: "bold", fill: "#FBBF24", align: "center" }),
          text(100, 700, 800, "KESTREL & CO.", { fontSize: 64, fontFamily: "Montserrat", fontWeight: "bold", fill: "#111827", align: "center", charSpacing: 250 }),
          text(100, 800, 800, "ESTABLISHED 2026", { fontSize: 28, fontFamily: "Inter", fill: "#6B7280", align: "center", charSpacing: 400 }),
        ],
      },
    ],
  },
  {
    id: "webinar-banner",
    name: "Webinar Banner",
    category: "LinkedIn Banner",
    width: 1584,
    height: 396,
    tags: ["linkedin", "banner", "webinar", "event"],
    pages: [
      {
        background: grad(90, "#0F766E", "#14B8A6"),
        objects: [
          circle(1400, 200, 260, "#FFFFFF", { opacity: 0.1 }),
          circle(1250, 360, 120, "#FFFFFF", { opacity: 0.1 }),
          text(80, 90, 1000, "Free webinar: Scaling design teams", { fontSize: 64, fontFamily: "Poppins", fontWeight: "bold", fill: "#FFFFFF" }),
          text(80, 200, 1000, "Thursday, 4 PM CET · Register at events.example", { fontSize: 34, fontFamily: "Inter", fill: "#CCFBF1" }),
        ],
      },
    ],
  },
  {
    id: "birthday-card",
    name: "Birthday Wishes",
    category: "Instagram Post",
    width: 1080,
    height: 1080,
    tags: ["birthday", "celebration", "card", "party"],
    pages: [
      {
        background: grad(135, "#FDE68A", "#FBCFE8"),
        objects: [
          star(180, 200, 60, "#F472B6"),
          star(900, 160, 40, "#A78BFA"),
          star(940, 880, 70, "#F59E0B"),
          circle(150, 900, 50, "#60A5FA"),
          path(540, 330, 180, 160, SHAPE_PATHS.heart, "#EC4899"),
          text(90, 460, 900, "Happy\nBirthday!", { fontSize: 170, fontFamily: "Lobster", fill: "#7C2D12", align: "center", lineHeight: 1 }),
          text(90, 860, 900, "Wishing you a year full of joy", { fontSize: 40, fontFamily: "Poppins", fill: "#7C2D12", align: "center" }),
        ],
      },
    ],
  },
  {
    id: "fitness-promo",
    name: "Fitness Class",
    category: "Facebook Cover",
    width: 1640,
    height: 624,
    tags: ["fitness", "gym", "cover", "sport"],
    pages: [
      {
        background: "#111111",
        objects: [
          triangle(980, 0, 900, 624, "#D7FF3A", { angle: 0 }),
          rect(1180, 0, 460, 624, "#D7FF3A"),
          text(90, 150, 900, "MOVE\nEVERY DAY", { fontSize: 150, fontFamily: "Bebas Neue", fill: "#FFFFFF", lineHeight: 0.92 }),
          text(90, 470, 900, "HIIT · YOGA · STRENGTH — FIRST CLASS FREE", { fontSize: 36, fontFamily: "Oswald", fill: "#D7FF3A", charSpacing: 120 }),
          ellipse(1380, 312, 150, 150, "#111111"),
          text(1230, 270, 300, "JOIN", { fontSize: 80, fontFamily: "Bebas Neue", fill: "#D7FF3A", align: "center" }),
        ],
      },
    ],
  },
  {
    id: "tech-announcement",
    name: "Feature Announcement",
    category: "X / Twitter Post",
    width: 1600,
    height: 900,
    tags: ["tech", "announcement", "product", "update"],
    pages: [
      {
        background: "#F8FAFC",
        objects: [
          rect(80, 80, 1440, 740, "#FFFFFF", { radius: 36, shadow: { color: "rgba(15,23,42,0.12)", blur: 40, offsetY: 12 } }),
          rect(160, 170, 180, 56, "#EEF2FF", { radius: 28 }),
          text(160, 184, 180, "NEW", { fontSize: 26, fontFamily: "Inter", fontWeight: "bold", fill: "#4F46E5", align: "center", charSpacing: 200 }),
          text(160, 280, 1000, "Real-time comments\nare here.", { fontSize: 104, fontFamily: "Inter", fontWeight: "bold", fill: "#0F172A", lineHeight: 1.05 }),
          text(160, 560, 900, "Leave feedback right on the canvas, mention teammates, and resolve threads when you're done.", { fontSize: 36, fontFamily: "Inter", fill: "#475569", lineHeight: 1.4 }),
          path(1300, 380, 260, 240, SHAPE_PATHS.bubble, "#4F46E5"),
        ],
      },
    ],
  },
];

export const TEMPLATE_CATEGORIES = Array.from(new Set(TEMPLATES.map((t) => t.category)));

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function templateToDoc(template: Template): DesignDoc {
  return {
    version: 1,
    width: template.width,
    height: template.height,
    pages: template.pages.map((p) => ({ id: newPageId(), background: p.background, objects: structuredClone(p.objects) })),
  };
}
