import { siteConfig } from "../src/config/siteConfig.ts";
import { sakuraConfig } from "../src/config/effectsConfig.ts";
import { backgroundWallpaper } from "../src/config/backgroundWallpaper.ts";
import { musicPlayerConfig } from "../src/config/musicConfig.ts";
import { commentConfig } from "../src/config/commentConfig.ts";
import { footerConfig } from "../src/config/footerConfig.ts";
import { profileConfig } from "../src/config/profileConfig.ts";
import { navBarConfig } from "../src/config/navBarConfig.ts";
import { announcementConfig } from "../src/config/announcementConfig.ts";
import { analyticsConfig } from "../src/config/analyticsConfig.ts";
import { coverImageConfig } from "../src/config/coverImageConfig.ts";
import { fontConfig } from "../src/config/fontConfig.ts";
import { licenseConfig } from "../src/config/licenseConfig.ts";
import { galleryConfig } from "../src/config/galleryConfig.ts";
import { sponsorConfig } from "../src/config/sponsorConfig.ts";
import { sidebarLayoutConfig } from "../src/config/sidebarConfig.ts";
import { live2dWidgetConfig, spineModelConfig } from "../src/config/pioConfig.ts";
import { plantumlConfig } from "../src/config/plantumlConfig.ts";
import { homePortfolioIntroSettings } from "../src/config/homePortfolioIntro.ts";
import * as fs from "fs";
const out: Record<string, any> = {
  site: siteConfig,
  effects: sakuraConfig,
  wallpaper: backgroundWallpaper,
  music: musicPlayerConfig,
  comment: commentConfig,
  footer: footerConfig,
  profile: profileConfig,
  nav: navBarConfig,
  announcement: announcementConfig,
  analytics: analyticsConfig,
  coverImage: coverImageConfig,
  font: fontConfig,
  license: licenseConfig,
  gallery: galleryConfig,
  sponsor: sponsorConfig,
  sidebar: sidebarLayoutConfig,
  pio: { live2d: live2dWidgetConfig, spine: spineModelConfig },
  plantuml: plantumlConfig,
  portfolio: homePortfolioIntroSettings,
};
const outPath = process.cwd() + "/src/data/all-configs.json";
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
console.log("Written", outPath, "with", Object.keys(out).length, "sections");
