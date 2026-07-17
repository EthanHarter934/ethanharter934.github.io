# AI Section, Sound Effects, and Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared Web Audio sound kit used across the site, a dedicated AI capabilities section (frontend + DynamoDB + MCP server), dedupe skills, update class standing to senior, and fix the pull chain's mobile hitbox.

**Architecture:** A new `frontend/src/utils/sfx.js` module owns one lazy AudioContext and synthesizes every sound (no audio files); components import named functions. The AI section is a new `AICapabilities.jsx` driven by data in `portfolio.js`, styled with the existing `glow-card` / `Reveal` system. Backend changes are data-only: a new `ai` skill category in the seed script and the `getSkills` MCP tool.

**Tech Stack:** React 19 + Vite 8, motion/react, Web Audio API, Node.js, AWS SDK v3 (DynamoDB), plain-node test file.

## Global Constraints

- Copy voice: chill college-student but professional; **never use em dashes** in site copy.
- No new npm dependencies.
- All sounds synthesized via Web Audio, same family as the chain click (filtered-noise tick + low sine thump), fired only from user gestures, silent no-op if AudioContext is unavailable.
- Frontend has no unit test runner; frontend tasks are verified by `npm run build` (rolldown gotcha: if build fails with MODULE_NOT_FOUND for `@rolldown/binding-win32-x64-msvc`, run `npm install --no-save @rolldown/binding-win32-x64-msvc@<rolldown version>` in `frontend/`).
- Backend tests: `npm test` in `backend/` (plain node script).
- Commit after every task.

---

### Task 1: Shared sfx module + PullChain refactor

**Files:**
- Create: `frontend/src/utils/sfx.js`
- Modify: `frontend/src/components/PullChain.jsx`

**Interfaces:**
- Produces: `ensureAudio()`, `click(downstroke = true, level = 1)`, `grab()`, `thud(velocityPxPerSec)`, `key()`, `send()` — all exported from `../utils/sfx`. Later tasks import these.

- [ ] **Step 1: Create `frontend/src/utils/sfx.js`**

```js
// Shared Web Audio sound kit. Every sound is synthesized on the fly in
// the pull chain's sonic family (filtered-noise tick + low sine thump);
// no audio files. All functions are safe no-ops when audio is unavailable,
// and everything fires from user gestures so autoplay policy never bites.

let ctx = null;

function getCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx?.state === 'suspended') ctx.resume();
  return ctx;
}

// one mechanical sound: a bandpassed noise burst plus a pitched-down thump
function mech({ freq, q = 1.1, noiseGain, noiseDur = 0.045, thumpFreq = 0, thumpGain = 0, thumpDur = 0.06 }) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;

  if (noiseGain > 0) {
    const len = Math.floor(c.sampleRate * 0.012);
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    const band = c.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = freq;
    band.Q.value = q;
    const gain = c.createGain();
    gain.gain.setValueAtTime(noiseGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + noiseDur);
    noise.connect(band);
    band.connect(gain);
    gain.connect(c.destination);
    noise.start(t);
  }

  if (thumpGain > 0) {
    const thump = c.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(thumpFreq, t);
    thump.frequency.exponentialRampToValueAtTime(65, t + thumpDur * 0.75);
    const gain = c.createGain();
    gain.gain.setValueAtTime(thumpGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + thumpDur);
    thump.connect(gain);
    gain.connect(c.destination);
    thump.start(t);
    thump.stop(t + thumpDur + 0.01);
  }
}

// warm the context up inside a user gesture (pointerdown) so the first
// real sound doesn't get eaten by a suspended context
export function ensureAudio() {
  return getCtx();
}

// the chain "tk": downstroke = switch engaging, release = snap home.
// level scales the whole thing down for quieter UI clicks.
export function click(downstroke = true, level = 1) {
  mech({
    freq: downstroke ? 2400 : 1800,
    noiseGain: (downstroke ? 0.55 : 0.32) * level,
    thumpFreq: downstroke ? 180 : 140,
    thumpGain: (downstroke ? 0.16 : 0.1) * level,
  });
}

// soft tick when a throwable gets picked up
export function grab() {
  mech({ freq: 1500, noiseGain: 0.16, noiseDur: 0.03, thumpFreq: 120, thumpGain: 0.05, thumpDur: 0.04 });
}

// impact thump for throwable bounces; velocity in px/s.
// quiet settle bounces stay silent, and impacts are rate-limited.
let lastThud = 0;
export function thud(velocity) {
  const speed = Math.abs(velocity);
  if (speed < 260) return;
  const now = performance.now();
  if (now - lastThud < 70) return;
  lastThud = now;
  const punch = Math.min(1, speed / 1600);
  mech({
    freq: 900 + punch * 500,
    q: 0.9,
    noiseGain: 0.1 + punch * 0.3,
    noiseDur: 0.05,
    thumpFreq: 110 + punch * 70,
    thumpGain: 0.08 + punch * 0.18,
    thumpDur: 0.07,
  });
}

// very quiet keystroke tick with a little random pitch so typing
// doesn't sound like a machine gun; rate-limited for key repeat
let lastKey = 0;
export function key() {
  const now = performance.now();
  if (now - lastKey < 34) return;
  lastKey = now;
  mech({ freq: 2100 + Math.random() * 700, q: 1.4, noiseGain: 0.06, noiseDur: 0.025 });
}

// brighter little click for sending a chat message
export function send() {
  mech({ freq: 2800, noiseGain: 0.2, noiseDur: 0.04, thumpFreq: 200, thumpGain: 0.06, thumpDur: 0.05 });
}
```

- [ ] **Step 2: Refactor `PullChain.jsx` to use the module**

Changes (behavior must stay identical):
- Add import: `import { click, ensureAudio } from '../utils/sfx';`
- Delete the whole local `playClick` function (lines 15-51) and the `audioRef` ref.
- Delete the local `ensureAudio` function inside the main effect; call the imported `ensureAudio()` in `onDown` instead.
- `fireToggle` becomes:

```js
    function fireToggle() {
      click(true);
      onToggleRef.current?.();
      dismissHintRef.current();
    }
```

- `onUp`'s fired branch becomes:

```js
      if (fired) {
        // the chain snaps back home: softer second click
        setTimeout(() => click(false), 90);
      }
```

- `handleKeyToggle` becomes:

```js
  const handleKeyToggle = () => {
    ensureAudio();
    click(true);
    setTimeout(() => click(false), 120);
    onToggle?.();
    dismissHintRef.current();
  };
```

- [ ] **Step 3: Verify build**

Run in `frontend/`: `npm run build`
Expected: build succeeds, no eslint/import errors. Also run `npm run lint`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/utils/sfx.js frontend/src/components/PullChain.jsx
git commit -m "refactor: extract shared Web Audio sfx kit from PullChain"
```

---

### Task 2: Throwable sounds

**Files:**
- Modify: `frontend/src/components/Throwable.jsx`

**Interfaces:**
- Consumes: `grab()`, `thud(velocity)`, `ensureAudio()` from `../utils/sfx`.

- [ ] **Step 1: Wire sounds into Throwable**

- Add import: `import { ensureAudio, grab, thud } from '../utils/sfx';`
- In `onPointerDown`, after `stopLoop();` add `ensureAudio();` (warms the context inside the gesture).
- In the `onMove` handler, inside the `if (!p.started) { ... }` block, right after `p.suppressClick = true;` add `grab();`.
- In `startLoop`'s `tick`, play a thud on real impacts. Wall bounces (capture pre-flip velocity):

```js
      if (p.x < EDGE) {
        p.x = EDGE;
        thud(p.vx);
        p.vx = -p.vx * RESTITUTION;
      } else if (p.x > rightWall) {
        p.x = rightWall;
        thud(p.vx);
        p.vx = -p.vx * RESTITUTION;
      }

      if (p.y >= floor) {
        p.y = floor;
        if (Math.abs(p.vy) > 220) {
          thud(p.vy);
          p.vy = -p.vy * RESTITUTION;
        } else {
          p.vy = 0;
        }
        p.vx *= 0.88; // ground friction
      }
```

(`thud` itself ignores impacts below 260 px/s and rate-limits, so no extra guards here.)

- [ ] **Step 2: Verify build**

Run in `frontend/`: `npm run build` — expect success.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Throwable.jsx
git commit -m "feat: pickup and bounce sounds for throwable buttons"
```

---

### Task 3: Terminal sounds

**Files:**
- Modify: `frontend/src/components/Terminal.jsx`

**Interfaces:**
- Consumes: `key()`, `send()` from `../utils/sfx`.

- [ ] **Step 1: Wire sounds into Terminal**

- Add import: `import { key as keySfx, send as sendSfx } from '../utils/sfx';`
- In `handleSend`, right after the guard `if (!trimmed || loading || !booted) return;` add `sendSfx();`.
- On the chat `<input>`, add a keydown handler that ticks only for real typing:

```jsx
          onKeyDown={(event) => {
            if (event.key.length === 1 || event.key === 'Backspace') keySfx();
          }}
```

(Enter triggers submit, which plays `send()` instead; modifier keys stay silent because their `key` is longer than 1 char.)

- [ ] **Step 2: Verify build**

Run in `frontend/`: `npm run build` — expect success.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Terminal.jsx
git commit -m "feat: keystroke and send sounds in the hero terminal"
```

---

### Task 4: Nav + button click sounds

**Files:**
- Modify: `frontend/src/components/Navbar.jsx`
- Modify: `frontend/src/components/Hero.jsx`
- Modify: `frontend/src/components/Footer.jsx`

**Interfaces:**
- Consumes: `click(downstroke, level)` from `../utils/sfx`. UI clicks use `click(true, 0.35)` — noticeably quieter than the chain's full click.

- [ ] **Step 1: Navbar**

- Add import: `import { click } from '../utils/sfx';`
- First line of `handleNavClick`: add `click(true, 0.35);`
- First line of `handleAskClick`: add `click(true, 0.35);`
- On the logo anchor's onClick (inside the existing handler, before `event.preventDefault()` is fine): add `click(true, 0.35);`
- Both `nav-cta` anchors (header + mobile overlay): add `onClick={() => click(true, 0.35)}`.

- [ ] **Step 2: Hero**

- Add import: `import { click } from '../utils/sfx';`
- `handleWorkClick`: add `click(true, 0.35);` as first line.
- Résumé link (`btn-quiet`): add `onClick={() => click(true, 0.35)}`.

- [ ] **Step 3: Footer**

- Add import: `import { click } from '../utils/sfx';`
- Email button anchor: add `onClick={() => click(true, 0.35)}`.
- Social link anchors: add `onClick={() => click(true, 0.35)}`.

(Note: after a throw, `Throwable`'s click-capture suppression stops the click before it reaches these handlers, so throws don't double-fire the click sound.)

- [ ] **Step 4: Verify build + commit**

Run in `frontend/`: `npm run build` — expect success.

```bash
git add frontend/src/components/Navbar.jsx frontend/src/components/Hero.jsx frontend/src/components/Footer.jsx
git commit -m "feat: quiet click feedback on nav and buttons"
```

---

### Task 5: AI capabilities section (data + component + CSS + nav + dedupe)

**Files:**
- Modify: `frontend/src/data/portfolio.js`
- Create: `frontend/src/components/AICapabilities.jsx`
- Modify: `frontend/src/styles/global.css`
- Modify: `frontend/src/pages/Home.jsx`

**Interfaces:**
- Produces: `aiCapabilities` export in `portfolio.js` — array of `{ title, description, chips }`; `AICapabilities` default-export component rendering `<section id="ai">`.

- [ ] **Step 1: Data changes in `portfolio.js`**

Replace `navLinks` with:

```js
export const navLinks = [
  { href: '#work', label: 'work', num: '01' },
  { href: '#ai', label: 'ai', num: '02' },
  { href: '#skills', label: 'skills', num: '03' },
  { href: '#background', label: 'background', num: '04' },
  { href: '#recognition', label: 'recognition', num: '05' },
  { href: '#contact', label: 'contact', num: '06' },
];
```

In `skills.tools`, remove `'BERT'` (the AI section owns it now). Result:

```js
export const skills = {
  languages: ['Python', 'JavaScript', 'HTML/CSS', 'SQL', 'C++', 'C#', 'C', 'Assembly', 'R', 'Java', 'TypeScript'],
  tools: ['React', 'Node.js', 'Linux SSH Servers', 'MySQL', 'GitHub', 'VSCode', 'Unity', 'AWS', 'Docker', 'FastAPI'],
};
```

Add after `skills`:

```js
export const aiCapabilities = [
  {
    title: 'LLM Integration & Agents',
    description:
      "I wire language models into real products. The chatbot in this site's terminal runs on AWS Bedrock with tool calling, deciding on its own which portfolio tools to query. ProPosture and MyLesion both lean on Gemini to turn raw model output into something people actually want to read.",
    chips: ['Claude', 'Gemini', 'AWS Bedrock', 'Tool Calling'],
  },
  {
    title: 'MCP Servers',
    description:
      'This portfolio runs on a custom MCP server I built from scratch. It exposes DynamoDB-backed tools for projects, skills, experience, and search, so the chat model grounds every answer in real data instead of guessing.',
    chips: ['MCP', 'Node.js', 'DynamoDB'],
  },
  {
    title: 'NLP & Model Fine-Tuning',
    description:
      'I fine-tune transformers for research: BERTweet classifiers for emotion, theme, and stance detection, plus topic modeling across tens of thousands of tweets. Two of my models are live on Hugging Face right now.',
    chips: ['BERTweet', 'Hugging Face', 'Topic Modeling'],
  },
  {
    title: 'Computer Vision',
    description:
      'From a MediaPipe pose pipeline that watches your posture in real time to an EfficientNetB0 CNN trained on 46,000+ clinical images, I like models that look at the world and do something useful with what they see.',
    chips: ['MediaPipe', 'EfficientNetB0', 'TensorFlow'],
  },
];
```

- [ ] **Step 2: Create `frontend/src/components/AICapabilities.jsx`**

```jsx
import { useRef } from 'react';
import { aiCapabilities } from '../data/portfolio';
import Reveal from './Reveal';
import SectionHeader from './SectionHeader';

// AI capability cards: same spotlight-glow border + lift as the work
// cards, staggered in on scroll.
function AICard({ item, index }) {
  const cardRef = useRef(null);

  const handlePointerMove = (event) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--gx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--gy', `${event.clientY - rect.top}px`);
  };

  return (
    <Reveal className="ai-cell" delay={(index % 2) * 0.06 + Math.floor(index / 2) * 0.05} y={18}>
      <article ref={cardRef} className="glow-card ai-card" onPointerMove={handlePointerMove}>
        <span className="ai-card-num" aria-hidden="true">{`0${index + 1}`}</span>
        <h3 className="ai-card-title">{item.title}</h3>
        <p className="ai-card-desc">{item.description}</p>
        <ul className="ai-card-chips">
          {item.chips.map((chip) => (
            <li key={chip}>
              <span className="skill-chip">{chip}</span>
            </li>
          ))}
        </ul>
      </article>
    </Reveal>
  );
}

export default function AICapabilities() {
  return (
    <section id="ai" className="section">
      <div className="container">
        <SectionHeader label="ai/ml" title="What I do with AI" />
        <div className="ai-grid">
          {aiCapabilities.map((item, index) => (
            <AICard key={item.title} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: CSS in `global.css`**

Add a new block after the SKILLS section styles (after `.skill-chip:hover`, around line 1111):

```css
/* ============================================================
   AI CAPABILITIES
   ============================================================ */
.ai-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(18px, 2.5vw, 28px);
}

.ai-cell {
  display: flex;
  min-width: 0;
}

.ai-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: clamp(22px, 3vw, 32px);
}

.ai-card-num {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.ai-card-title {
  font-size: clamp(1.15rem, 1.8vw, 1.4rem);
  letter-spacing: -0.01em;
}

.ai-card-desc {
  color: var(--sub);
  font-size: 0.95rem;
  line-height: 1.65;
}

.ai-card-chips {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
  padding: 0;
}
```

And inside the existing `@media (max-width: 1024px)` block add:

```css
  .ai-grid {
    grid-template-columns: 1fr;
  }
```

- [ ] **Step 4: Wire into `Home.jsx`**

```jsx
import AICapabilities from '../components/AICapabilities';
```

and in the JSX, between `<Projects />` and `<Skills />`:

```jsx
        <Projects />
        <AICapabilities />
        <Skills />
```

- [ ] **Step 5: Verify build + commit**

Run in `frontend/`: `npm run build` and `npm run lint` — expect success.

```bash
git add frontend/src/data/portfolio.js frontend/src/components/AICapabilities.jsx frontend/src/styles/global.css frontend/src/pages/Home.jsx
git commit -m "feat: dedicated AI capabilities section, dedupe BERT from tools"
```

---

### Task 6: Senior year copy

**Files:**
- Modify: `frontend/src/components/Hero.jsx:74`

- [ ] **Step 1: Update the operator line**

`Hero.jsx` line 74: change

```jsx
              <b>uptime:</b> junior year · graduating june 2027
```

to

```jsx
              <b>uptime:</b> senior year · graduating june 2027
```

(Repo sweep already done: the only other "junior" hits are seed.js "Junior Varsity" baseball entries, which are correct as-is.)

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Hero.jsx
git commit -m "fix: class standing is senior year now"
```

---

### Task 7: Backend — `ai` skill category (seed, MCP tool, tests)

**Files:**
- Modify: `backend/scripts/seed.js`
- Modify: `backend/mcp-server/tools/getSkills.js`
- Test: `backend/mcp-server/tools/tools.test.js`

**Interfaces:**
- Produces: skills with `category: 'ai'` in DynamoDB; `getSkills` accepts `category: 'ai'`.

- [ ] **Step 1: Write the failing test**

In `tools.test.js`, replace `mockSkills` and add a test:

```js
// Mock skill data
const mockSkills = [
  { SK: 'SKILL#python', data: { name: 'Python', category: 'language' } },
  { SK: 'SKILL#react', data: { name: 'React', category: 'framework' } },
  { SK: 'SKILL#github', data: { name: 'GitHub', category: 'tool' } },
  { SK: 'SKILL#mcp', data: { name: 'MCP (Model Context Protocol)', category: 'ai' } },
  { SK: 'SKILL#bertweet', data: { name: 'BERTweet', category: 'ai' } },
];

// Test: getSkills schema advertises the ai category
test('getSkills schema includes ai category', async () => {
  const { definition } = await import('./getSkills.js');
  const categories = definition.inputSchema.properties.category.enum;
  if (!categories.includes('ai')) throw new Error(`'ai' missing from enum: ${categories}`);
});

// Test: Filter skills by ai category
test('Filter skills by ai category', () => {
  let skills = mockSkills.map((item) => ({
    id: item.SK.replace('SKILL#', ''),
    ...item.data,
  }));

  skills = skills.filter((s) => s.category === 'ai');

  if (skills.length !== 2) throw new Error(`Expected 2 ai skills, got ${skills.length}`);
});
```

Also update the existing 'Parse skills correctly' test's length check from `!== 3` to `!== 5`, and make `runTests` handle async test fns (`await fn();`).

Note: importing `getSkills.js` pulls in `dynamoClient.js`; that module only creates a client (no network call at import time), so the import is safe. If it throws on missing env, set fallbacks at the top of the test file before the import: `process.env.AWS_REGION ||= 'us-east-1';` (check `dynamoClient.js` first; only add what it needs).

- [ ] **Step 2: Run test to verify it fails**

Run in `backend/`: `npm test`
Expected: FAIL — `'ai' missing from enum`.

- [ ] **Step 3: Update `getSkills.js`**

```js
export const definition = {
  name: 'getSkills',
  description:
    'Retrieve technical skills. Optionally filter by category: ai, language, framework, tool, cloud, or other. The ai category covers LLM integration, MCP, model fine-tuning, and computer vision skills.',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['ai', 'language', 'framework', 'tool', 'cloud', 'other'],
        description: 'Filter skills by category.',
      },
    },
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run in `backend/`: `npm test` — expect all pass.

- [ ] **Step 5: Update `seed.js`**

5a. In the Tools & Frameworks array, **delete** these entries (they move to the ai block): `BERT`, `BERTweet`, `MediaPipe`, `EfficientNetB0`, `Hugging Face`, `Gemini`, `Claude Haiku`, `gTTS`, `AWS Bedrock`.

5b. After the Tools block, add:

```js
  // ── Skills — AI / ML ──────────────────────────────────────────────────────
  ...[
    { name: 'Claude (AWS Bedrock)', category: 'ai', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'Gemini', category: 'ai', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'AWS Bedrock', category: 'ai', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'MCP (Model Context Protocol)', category: 'ai', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'Tool Calling / Agents', category: 'ai', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'Prompt Engineering', category: 'ai', proficiencyLevel: 'advanced', yearsOfExperience: 2 },
    { name: 'BERT', category: 'ai', proficiencyLevel: 'advanced', yearsOfExperience: 2 },
    { name: 'BERTweet', category: 'ai', proficiencyLevel: 'advanced', yearsOfExperience: 1 },
    { name: 'Hugging Face', category: 'ai', proficiencyLevel: 'advanced', yearsOfExperience: 1 },
    { name: 'MediaPipe', category: 'ai', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'EfficientNetB0', category: 'ai', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'gTTS', category: 'ai', proficiencyLevel: 'beginner', yearsOfExperience: 1 },
  ].map((skill, idx) => ({
    PK: PROFILE_PK,
    SK: `SKILL#${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-ai-${idx}`,
    type: 'skill',
    data: skill,
  })),
```

5c. Skill SKs are index-based, so re-running the seed after a reshuffle strands stale items. Make the seed purge existing SKILL# rows first. Add imports `QueryCommand` alongside `BatchWriteCommand`, then in `seed()` before the write loop:

```js
  // skill SKs are index-based; purge existing skills so a reseed can't strand stale rows
  const existing = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: { ':pk': PROFILE_PK, ':skPrefix': 'SKILL#' },
      ProjectionExpression: 'PK, SK',
    }),
  );
  const stale = existing.Items || [];
  for (let i = 0; i < stale.length; i += batchSize) {
    const batch = stale.slice(i, i + batchSize);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batch.map((item) => ({ DeleteRequest: { Key: { PK: item.PK, SK: item.SK } } })),
        },
      }),
    );
  }
  if (stale.length) console.log(`  Purged ${stale.length} existing skill rows`);
```

(`QueryCommand` comes from `@aws-sdk/lib-dynamodb`, same as the tools use. Move `const batchSize = 25;` above the purge.)

- [ ] **Step 6: Syntax-check the seed script without AWS**

Run in `backend/`: `node --check scripts/seed.js`
Expected: no output (parses clean). Do NOT run the seed itself; it needs live AWS credentials and is an owner action after merge.

- [ ] **Step 7: Commit**

```bash
git add backend/scripts/seed.js backend/mcp-server/tools/getSkills.js backend/mcp-server/tools/tools.test.js
git commit -m "feat: ai skill category in seed data and getSkills MCP tool"
```

---

### Task 8: Mobile pull-chain hitbox

**Files:**
- Modify: `frontend/src/styles/global.css` (the `.chain-hit` rule, ~line 335)

- [ ] **Step 1: CSS changes**

Update the hit rule and add a coarse-pointer bump:

```css
.chain-wrap svg .chain-hit {
  fill: transparent;
  pointer-events: auto;
  cursor: grab;
  /* a touch drag grabs the chain instead of scrolling the page */
  touch-action: none;
}

/* fingers need a bigger target than cursors: ~43px effective at the
   64px mobile chain width, up from ~30px */
@media (pointer: coarse) {
  .chain-wrap svg .chain-hit {
    r: 30;
  }
}
```

(The `r` CSS property overrides the SVG `r="21"` attribute; supported in all modern browsers. The circle is invisible either way.)

- [ ] **Step 2: Verify build + commit**

Run in `frontend/`: `npm run build` — expect success.

```bash
git add frontend/src/styles/global.css
git commit -m "fix: pull chain is grabbable on touch screens"
```

---

### Task 9: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Backend tests**

Run in `backend/`: `npm test` — expect all tests pass.

- [ ] **Step 2: Frontend production build + lint**

Run in `frontend/`: `npm run build` and `npm run lint` — expect success (remember the rolldown binding gotcha).

- [ ] **Step 3: Playwright pass (desktop)**

Start `npm run dev` in `frontend/` (background), then with the Playwright MCP tools:
- Load the site; confirm no console errors.
- Confirm the navbar shows `01 work / 02 ai / 03 skills / 04 background / 05 recognition / 06 contact`.
- Click `ai` in the nav; confirm the AI section scrolls into view with 4 cards, and the card hover lifts/glows.
- Confirm the skills marquee no longer contains a `BERT` chip.
- Confirm the hero operator line reads "senior year".
- Drag the pull chain handle down ≥ 40px; confirm the theme flips.
- Type into the terminal input (sounds can't be heard headless; just confirm no errors on keydown/submit).
- Throw the hero CTA button; confirm it falls, bounces, and no console errors.

- [ ] **Step 4: Playwright pass (mobile viewport)**

Resize to 390×844:
- Confirm the AI section renders 1-column.
- Locate `.chain-hit`; confirm its bounding box is ≥ 40px in both dimensions.
- Drag from the chain handle downward ≥ 60px; confirm the theme flips and the page does NOT scroll during the drag.

- [ ] **Step 5: Update memory + report**

Note any surprises in the session summary. Remind Ethan to run `npm run seed` in `backend/` with AWS credentials to push the new skill data, then redeploy the Lambda bundle if the MCP server ships inside it (`npm run package`).
