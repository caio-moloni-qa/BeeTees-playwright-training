# Narrated Playwright demo recordings — a portable playbook

A pattern for producing **paced, captioned, self-narrating screen recordings** of a web
application, driven by Playwright, with zero editing afterwards. Originally built for the
IRIS QA suite; everything below is deliberately application-agnostic and depends only on
`@playwright/test`.

**What you get per demo:** one `.webm` video at a fixed resolution, with an on-screen caption
bar explaining each beat, a soft cursor dot so clicks read as a person's, and a `captions.vtt`
sidecar you can attach to a player or hand to a video editor.

**What it is not:** a test run. Demos live in their own Playwright project, match their own
filename suffix, and are never collected by `npx playwright test`.

---

## 1. The core idea

A demo is a Playwright spec that *also* asserts, but whose primary output is the video. Three
things make it a demo rather than a test:

| Concern | Test | Demo |
|---|---|---|
| Headless | yes | **no** — headed, so the recording shows a real browser |
| Pace | as fast as possible | `slowMo` + an explicit hold per caption |
| Video | `retain-on-failure` | **always on**, fixed size |
| Narration | none | a caption bar injected into the page |
| Assertions | the point | still present — a demo that silently stopped working is worthless |

Keep the assertions. A narrated recording whose claims are not actually checked is a
marketing video, and it will eventually lie. The captions say what the assertion proves.

---

## 2. Layout

```
<repo>/
  <app>/Demo/
    narration.ts              # the Narrator class — copy verbatim, it is portable
    <feature>.demo.ts         # one file per story/bug/feature
    <helpers>.ts              # optional shared page-poking helpers
  playwright.config.ts        # gains one `demo` project
  package.json                # gains one `demo:*` script per recording
```

Two conventions carry the whole isolation story:

- **Directory**: demos live under a dedicated `Demo/` folder.
- **Suffix**: `*.demo.ts`, never `*.spec.ts`. No other project's `testMatch` can pick them
  up by accident, and `--grep`/`--last-failed` workflows stay clean.

---

## 3. The Playwright project

Add one project. Do not change the defaults for anything else.

```ts
// playwright.config.ts
export default defineConfig({
  testDir: './',
  // Demos are collectable by the runner but only through their own project.
  testMatch: ['**/Tests/**/*.spec.ts', '**/Demo/**/*.demo.ts'],
  workers: 1,               // recordings must not interleave
  fullyParallel: false,

  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    // ...your normal projects...

    // ── Demo walkthroughs ────────────────────────────────────────────────
    // Headed, slowed, always video-recorded — for screen recordings, never part
    // of a test run. Run with: npm run demo:<name>
    {
      name: 'demo',
      testMatch: ['**/Demo/**/*.demo.ts'],
      dependencies: ['setup'],          // whatever your auth/seed setup project is
      timeout: 20 * 60_000,             // narration is slow; a demo is minutes, not seconds
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        baseURL: process.env.APP_URL ?? 'http://localhost:3000',
        viewport: { width: 1440, height: 900 },
        video: { mode: 'on', size: { width: 1440, height: 900 } },
        screenshot: 'off',              // stills are noise here
        trace: 'off',                   // tracing visibly costs frames
        launchOptions: { slowMo: Number(process.env.DEMO_SLOWMO_MS ?? 600) },
      },
    },
  ],

  outputDir: 'test-results/',
});
```

Notes that matter:

- **`viewport` and `video.size` must match.** Mismatched sizes give you a letterboxed or
  rescaled recording that looks soft on a projector.
- **`headless: false`.** A headless recording works but renders fonts and focus rings
  differently from what your audience will see.
- **`trace: 'off'`.** Tracing screenshots every action and shows up as stutter in the video.
- **Long `timeout`.** At 5.5 s per caption, twenty captions plus real waits is easily
  10 minutes. Also set `test.setTimeout(...)` inside each demo.
- **`workers: 1`.** Two headed browsers fighting for the foreground ruins both takes.
- **Optionally pin the browser channel** (e.g. `channel: 'chrome'`) — real Chrome's UI chrome
  and font rendering look more like the viewer's own browser than bundled Chromium does.

---

## 4. `narration.ts` — copy this file verbatim

Zero project-specific imports. Drop it in `Demo/narration.ts` and it works on any app.

```ts
import type { Locator, Page } from '@playwright/test';
import * as fs from 'fs';
import * as pathMod from 'path';

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
        if (document.getElementById('demo-caption')) return;
        const style = document.createElement('style');
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
        const cap = document.createElement('div'); cap.id = 'demo-caption'; document.body.appendChild(cap);
        const cur = document.createElement('div'); cur.id = 'demo-cursor'; document.body.appendChild(cur);
        document.addEventListener('mousemove', e => { cur.style.left = `${e.clientX}px`; cur.style.top = `${e.clientY}px`; }, true);
        document.addEventListener('mousedown', () => cur.classList.add('down'), true);
        document.addEventListener('mouseup', () => cur.classList.remove('down'), true);
      };
      if (document.body) ready(); else document.addEventListener('DOMContentLoaded', ready);
    });
  }

  /** Show a caption (with an optional small eyebrow line) and hold it for `holdMs` (default one beat). */
  async say(text: string, opts: { eyebrow?: string; holdMs?: number } = {}) {
    this.cues.push({ at: Date.now() - this.t0, text });
    await this.page.evaluate(({ text, eyebrow }) => {
      const el = document.getElementById('demo-caption'); if (!el) return;
      el.innerHTML = '';
      el.appendChild(document.createTextNode(text));
      if (eyebrow) { const s = document.createElement('small'); s.textContent = eyebrow; el.appendChild(s); }
      el.classList.add('show');
    }, { text, eyebrow: opts.eyebrow ?? '' });
    await this.page.waitForTimeout(opts.holdMs ?? this.beatMs);
  }

  /** Bring an element to the middle of the screen, draw the eye to it, and rest a moment before acting. */
  async focus(selector: string | Locator, restMs = 900) {
    const loc = typeof selector === 'string' ? this.page.locator(selector).first() : selector;
    await loc.scrollIntoViewIfNeeded();
    await loc.evaluate((el: Element) => { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('demo-focus'); });
    await this.page.waitForTimeout(restMs);
    await loc.evaluate((el: Element) => el.classList.remove('demo-focus'));
  }

  async pause(ms = this.beatMs) { await this.page.waitForTimeout(ms); }

  /** Write the cues as WebVTT; each cue runs until the next one starts (the last one holds 6 s). */
  writeVtt(path: string) {
    const ts = (ms: number) => {
      const h = Math.floor(ms / 3_600_000), m = Math.floor(ms / 60_000) % 60, s = Math.floor(ms / 1000) % 60, f = ms % 1000;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(f).padStart(3, '0')}`;
    };
    const lines = ['WEBVTT', ''];
    this.cues.forEach((c, i) => {
      const end = i + 1 < this.cues.length ? this.cues[i + 1].at : c.at + 6000;
      lines.push(String(i + 1), `${ts(c.at)} --> ${ts(end)}`, c.text, '');
    });
    fs.mkdirSync(pathMod.dirname(path), { recursive: true }); // Playwright creates outputDir lazily
    fs.writeFileSync(path, lines.join('\n'));
  }
}
```

### Why each piece is the way it is

- **`addInitScript`, not `evaluate` after load.** The caption bar must survive every
  navigation in the walkthrough. `addInitScript` re-runs on each document; a one-shot
  `evaluate` gets wiped by the first full page load and your demo goes silent halfway.
- **`pointer-events: none` on the caption and cursor.** Otherwise the overlay swallows clicks
  on anything underneath it and Playwright starts timing out on real controls.
- **`z-index: 2147483000`.** Above app modals and toasts. The cursor sits one higher.
- **DOM overlay, not an OS-level overlay.** Because the caption lives *in the page*, it is
  captured identically by Playwright's video and by QuickTime/OBS/Loom if you'd rather record
  the desktop. One implementation, both capture paths.
- **`scrollIntoView({ block: 'center' })` plus a resting pause.** A viewer cannot follow a
  script that acts the instant an element appears. `focus()` moves the thing to eye level,
  outlines it, and *waits* before the action happens.
- **Cues timestamped from construction.** Create the `Narrator` immediately before the first
  `page.goto` and the VTT lines up with the video's first frame to within a second.

### Optional extras worth adding for your project

- `await this.page.mouse.move(x, y)` wrappers if you want the cursor dot to travel visibly to
  a target before the click (Playwright's own clicks teleport).
- A `chapter(title)` method that emits a full-screen title card between sections, for long
  walkthroughs.
- A `redact(locator)` method that blurs an element via CSS `filter` — essential if the app
  shows real names, emails, or account numbers.

---

## 5. Anatomy of a demo file

```ts
import * as path from 'path';
import { test, expect } from '../fixtures/test';   // or '@playwright/test'
import { SomePage } from '../Page/somePage';
import { Narrator } from './narration';

/**
 * <TICKET> walkthrough for a screen recording — a PACED, NARRATED take, not a test.
 *
 *   npm run demo:<ticket>
 *
 * <One paragraph: what a viewer will see and what it proves.>
 *
 *   DEMO_BEAT_MS    hold per caption (default 5500)
 *   DEMO_SLOWMO_MS  delay between browser actions (default 600, set in playwright.config.ts)
 */
const BEAT = Number(process.env.DEMO_BEAT_MS ?? 5500);

test('<TICKET> — <the claim the video makes, in one line>', async ({ page }, testInfo) => {
  test.setTimeout(15 * 60_000);

  // 1. SEED — put the world in the exact state the story needs, before any narration.
  const fixture = await seedTheScenario();

  // 2. INSTALL — narrator first, before the app loads.
  const narrator = new Narrator(page, BEAT);
  await narrator.install();
  const somePage = new SomePage(page);

  try {
    await page.goto('/');

    // 3. FRAME — why the viewer should care, in one sentence.
    await narrator.say('<TICKET>: <the problem, in plain language a non-engineer follows>.',
      { eyebrow: '<Area> · <Sub-area>' });

    // 4. BEATS — navigate, focus, assert, narrate. In that order.
    await somePage.open(fixture.id);
    await narrator.focus(somePage.statusChip, 1200);
    await expect(somePage.statusChip).toHaveText('Exception');
    await narrator.say('Status reads Exception — flagged, impossible to miss on the board.',
      { eyebrow: 'Step 1 · The flag' });

    // ... more beats ...

    // 5. LAND IT — the last caption states the outcome, held a beat longer.
    await narrator.say('<What was proven, said as a result, not as a step>.',
      { eyebrow: 'Outcome · <three words>', holdMs: BEAT * 1.3 });
  } finally {
    // 6. ALWAYS — release shared state and write the captions, pass or fail.
    await releaseSharedFixture().catch(() => {});
    narrator.writeVtt(path.join(testInfo.outputDir, 'captions.vtt'));
  }
});
```

The `try/finally` is not decoration. A demo that throws mid-take still produces a partial
video; without the `finally` you get that video with no captions file and, worse, a shared
fixture left locked so the *next* take cannot run.

---

## 6. Writing the narration

The captions are the deliverable. Treat them as copy, not as logging.

**Voice**
- Plain language. A product owner or a support lead should follow it without the codebase.
- Present tense, active. "The classifier caught it", not "the duplicate was detected".
- One idea per caption. If a caption needs a comma-spliced second clause, it's two beats.
- Roughly 15–30 words. Longer than that and 5.5 seconds is not enough to read it.

**Interpolate real values.** The single most convincing thing a demo does is read state back
off the page and say it out loud:

```ts
const diagnosis = await field.inputValue();
expect(diagnosis).toBe('E11.9');
await narrator.say(`Primary Diagnosis reads "${diagnosis}" — the dotted form, recovered automatically.`,
  { eyebrow: 'Outcome · Recovered, not blank' });
```

A caption quoting a value the viewer can see on screen cannot be a stale hardcoded claim.

**Eyebrows** (the small uppercase line) carry the structure so the caption text doesn't have
to. A consistent taxonomy:

- Opening beat: `<Area> · <Sub-area>` — e.g. `Document Management · Exception Handling`
- Middle beats: `Step 1 · <short phrase>`, `Step 2 · ...`
- Closing beat: `Outcome · <short phrase>` or `Outcome`
- Before/after pairs: `Before the fix · current dev` / `After the fix · branch <name>`

**Say what is *not* happening** where that is the point. "And the Portal section — while it
exists for this patient — carries nothing. Not sent there at all." Negative assertions are
invisible on screen unless narrated.

---

## 7. Before/after pairs

For bug demos, two files beat one: `<bug>-before.demo.ts` and `<bug>-after.demo.ts`, recorded
against the two branches, then played back to back.

- **Before** records the symptom against the unfixed build and narrates it as the reported
  problem. It asserts the *broken* behaviour, so the file itself documents the bug.
- **After** asserts the fix.
- Both must be independently re-runnable. If `before` claims/locks a shared row, it must hand
  it back in its `finally` or `after` cannot run at all.
- Parameterise the fixture: `const TASK_ID = Number(process.env.TASK_ID ?? 3197528);` so the
  same file works against a different environment's data.

---

## 8. npm scripts — one per recording

```json
{
  "scripts": {
    "demo:2899": "playwright test --project=demo <app>/Demo/docmgmt-2899-exception-duplicate.demo.ts",
    "demo:6503": "playwright test --project=demo <app>/Demo/cmm-6503-undotted-icd10.demo.ts"
  }
}
```

Name them after the ticket, not the feature. When someone asks "can I see #6503?", the answer
is a command they can paste. Never add a `demo:all` — recordings are produced one at a time
and watched as they run.

Tuning knobs at the call site:

```bash
npm run demo:6503                       # defaults: 600 ms slowMo, 5.5 s beats
DEMO_BEAT_MS=4000 npm run demo:6503     # faster read, for an audience that knows the app
DEMO_SLOWMO_MS=900 npm run demo:6503    # slower clicks, for a live presentation
```

---

## 9. Collecting the output

Playwright writes per-test artifacts to `<outputDir>/<file>-<title-slug>-<project>/`:

```
test-results/Demo-cmm-6503-undotted-icd10-...-demo/
  video.webm       # 1440×900, the whole take
  captions.vtt     # written by narrator.writeVtt()
```

A collection step worth adding:

```bash
# scripts/collect-demo.sh <ticket>
set -euo pipefail
src=$(ls -dt test-results/*"$1"*demo | head -1)
mkdir -p demos
cp "$src/video.webm"   "demos/$1.webm"
cp "$src/captions.vtt" "demos/$1.vtt"
```

**`.webm` → `.mp4`** for anyone on Windows/PowerPoint/Teams:

```bash
ffmpeg -i demos/6503.webm -c:v libx264 -pix_fmt yuv420p -crf 20 demos/6503.mp4
```

**Burn the captions in** (only if the player can't do sidecars — the on-screen bar is already
in the frame, so this is usually redundant):

```bash
ffmpeg -i demos/6503.webm -vf subtitles=demos/6503.vtt -c:v libx264 demos/6503-subbed.mp4
```

Do not commit videos. `demos/` belongs in `.gitignore`; upload to the ticket, the wiki, or
wherever your team keeps artifacts.

---

## 10. Pitfalls, all of them learned the hard way

1. **Non-deterministic seed data.** A demo that depends on whatever happens to be in the
   environment will eventually record a blank screen for an audience. Seed the exact scenario
   inside the demo, before any narration.
2. **Filter the list to one row.** Never narrate "the first row" of an unfiltered table — the
   ordering will change. Filter to a known ID, then *assert* the visible row is that ID before
   reading anything off it.
3. **Shared fixtures left locked.** If a demo claims/locks/checks-out a record, release it in
   `finally`, and make the claim tolerant of a row a previous crashed run left claimed.
4. **Animations and toasts.** Consider `reducedMotion: 'reduce'` in `use`, and pause for
   toasts to clear before a `focus()` so the outline isn't fighting a slide-in.
5. **Real data on screen.** Redact or use synthetic data. A recording gets forwarded further
   than you expect.
6. **Captions overlapping app chrome.** The bar sits at `top: 18px`, centred. If your app has a
   fixed top nav with content there, move it to the bottom (`bottom: 18px`, drop the
   `transform` on Y).
7. **Trace/screenshot left on.** Both show up as visible stutter. Off in the demo project.
8. **Flaky waits narrated as facts.** If a beat says "the badge turned green", `expect()` it
   first. Narration that outruns reality is how a demo ships a false claim.
9. **Demos rotting silently.** They are not in the default test run by design — so add them to
   a weekly/nightly job, or they will break unnoticed and you'll find out ten minutes before
   the sprint review.

---

## 11. Bring-up checklist for a new project

1. `mkdir <app>/Demo` and copy `narration.ts` in, verbatim.
2. Add the `demo` project to `playwright.config.ts` (§3). Point `dependencies` at whatever
   project handles auth/setup, so demos don't record a login screen unless you want them to.
3. Write one demo end to end. Watch it. Fix the pace before writing a second.
4. Add its `demo:<ticket>` npm script.
5. Add `demos/` to `.gitignore`, and a collect script if you'll be exporting often.
6. Agree the eyebrow taxonomy (§6) with whoever else will write demos — consistency across
   recordings is what makes a set of them look like a product, not a pile of screen captures.
