import type { Locator, Page } from "@playwright/test";
import * as fs from "fs";
import * as pathMod from "path";

/**
 * On-screen narration for demo walkthroughs, plus a WebVTT sidecar for the editor.
 *
 * The caption bar is injected into the page (fixed, top-centre, pointer-events none) so it
 * lands in Playwright's own recording and in any desktop screen recording alike. A soft
 * cursor dot follows the mouse so clicks read as a person's, not a script's. Every `say` is
 * timestamped from the moment the narrator was created, which is within a second of the
 * video's first frame.
 */
export class Narrator {
  private readonly cues: { at: number; text: string }[] = [];
  private readonly t0 = Date.now();

  constructor(private readonly page: Page, private readonly beatMs: number) {}

  /** Install the caption bar and cursor before the app loads; safe to call once per page. */
  async install() {
    await this.page.addInitScript(() => {
      const ready = () => {
        if (document.getElementById("demo-caption")) return;
        const style = document.createElement("style");
        style.textContent = `
          #demo-caption{position:fixed;top:18px;left:50%;transform:translateX(-50%);max-width:1100px;z-index:2147483000;
            background:rgba(15,23,42,.92);color:#fff;font:600 22px/1.35 -apple-system,"Segoe UI",Helvetica,Arial,sans-serif;
            padding:14px 22px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.35);pointer-events:none;
            opacity:0;transition:opacity .35s ease;letter-spacing:.01em;text-align:center}
          #demo-caption.show{opacity:1}
          #demo-caption small{display:block;font-weight:500;font-size:15px;opacity:.75;margin-top:4px;letter-spacing:.08em;text-transform:uppercase}
          #demo-cursor{position:fixed;z-index:2147483001;width:22px;height:22px;border-radius:50%;pointer-events:none;
            background:rgba(37,99,235,.35);border:2px solid rgba(37,99,235,.95);transform:translate(-50%,-50%);
            transition:left .12s ease,top .12s ease,transform .1s ease;left:-100px;top:-100px}
          #demo-cursor.down{transform:translate(-50%,-50%) scale(.7);background:rgba(37,99,235,.7)}
          .demo-focus{outline:3px solid rgba(37,99,235,.85)!important;outline-offset:4px!important;border-radius:6px;transition:outline-color .3s}`;
        document.head.appendChild(style);
        const cap = document.createElement("div"); cap.id = "demo-caption"; document.body.appendChild(cap);
        const cur = document.createElement("div"); cur.id = "demo-cursor"; document.body.appendChild(cur);
        document.addEventListener("mousemove", e => { cur.style.left = `${e.clientX}px`; cur.style.top = `${e.clientY}px`; }, true);
        document.addEventListener("mousedown", () => cur.classList.add("down"), true);
        document.addEventListener("mouseup", () => cur.classList.remove("down"), true);
      };
      if (document.body) ready(); else document.addEventListener("DOMContentLoaded", ready);
    });
  }

  /** Show a caption (with an optional small eyebrow line) and hold it for `holdMs` (default one beat). */
  async say(text: string, opts: { eyebrow?: string; holdMs?: number } = {}) {
    this.cues.push({ at: Date.now() - this.t0, text });
    await this.page.evaluate(({ text, eyebrow }) => {
      const el = document.getElementById("demo-caption"); if (!el) return;
      el.innerHTML = "";
      el.appendChild(document.createTextNode(text));
      if (eyebrow) { const s = document.createElement("small"); s.textContent = eyebrow; el.appendChild(s); }
      el.classList.add("show");
    }, { text, eyebrow: opts.eyebrow ?? "" });
    await this.page.waitForTimeout(opts.holdMs ?? this.beatMs);
  }

  /** Bring an element to the middle of the screen, draw the eye to it, and rest a moment before acting. */
  async focus(selector: string | Locator, restMs = 900) {
    const loc = typeof selector === "string" ? this.page.locator(selector).first() : selector;
    await loc.scrollIntoViewIfNeeded();
    await loc.evaluate((el: Element) => { el.scrollIntoView({ block: "center", behavior: "smooth" }); el.classList.add("demo-focus"); });
    await this.page.waitForTimeout(restMs);
    await loc.evaluate((el: Element) => el.classList.remove("demo-focus"));
  }

  async pause(ms = this.beatMs) { await this.page.waitForTimeout(ms); }

  /** Write the cues as WebVTT; each cue runs until the next one starts (the last one holds 6 s). */
  writeVtt(path: string) {
    const ts = (ms: number) => {
      const h = Math.floor(ms / 3_600_000), m = Math.floor(ms / 60_000) % 60, s = Math.floor(ms / 1000) % 60, f = ms % 1000;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(f).padStart(3, "0")}`;
    };
    const lines = ["WEBVTT", ""];
    this.cues.forEach((c, i) => {
      const end = i + 1 < this.cues.length ? this.cues[i + 1].at : c.at + 6000;
      lines.push(String(i + 1), `${ts(c.at)} --> ${ts(end)}`, c.text, "");
    });
    fs.mkdirSync(pathMod.dirname(path), { recursive: true }); // Playwright creates outputDir lazily
    fs.writeFileSync(path, lines.join("\n"));
  }
}
