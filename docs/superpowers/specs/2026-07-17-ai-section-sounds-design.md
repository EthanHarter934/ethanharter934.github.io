# AI Section, Site-Wide Sound Effects, and Polish — Design

Date: 2026-07-17
Status: Approved

## Goals

1. Add more satisfying sound effects across the site, in the same family as the pull-chain click.
2. Add a dedicated AI skills section (MCP, Gemini, LLM work) with matching animations.
3. Deduplicate: skills highlighted in the AI section leave the Skills & tools marquee.
4. Update the DynamoDB seed data and MCP server to carry the new AI skill category.
5. Update class standing from junior to senior.
6. Make the pull chain grabbable on mobile (bigger hitbox, no page-scroll hijack).

## 1. Shared sound kit — `frontend/src/utils/sfx.js`

Extract the Web Audio synthesis currently inlined in `PullChain.jsx` into a shared
module. One lazily created `AudioContext`, resumed on first gesture. No audio files;
everything is synthesized (filtered-noise tick + low sine thump, the chain's sonic
family).

API (all no-ops if AudioContext is unavailable):

- `click(bright, gain)` — the existing chain "tk", parameterized by brightness and
  volume. `PullChain` switches to this with zero audible change.
- `grab()` — soft, short pickup tick.
- `thud(velocity)` — impact thump; gain and pitch scale with impact speed, and
  impacts below a velocity threshold are silent so settle bounces don't spam.
- `key()` — very quiet keystroke tick with small random pitch variation.
- `send()` — slightly brighter click for submitting the chat input.

Sounds fire only from real user gestures (autoplay policy blocks anything else,
which is why the terminal boot animation stays silent).

## 2. Sound placement

- **Throwable buttons** (`Throwable.jsx`): `grab()` when a drag crosses the
  drag threshold and becomes a throw; `thud(velocity)` on floor and wall
  impacts, rate-limited; silence once resting.
- **Terminal** (`Terminal.jsx`): `key()` on keydown for printable keys in the
  chat input; `send()` on submit.
- **Nav + buttons**: quiet `click()` on navbar link clicks and primary `.btn`
  presses. Noticeably quieter than the chain.

## 3. AI section — `frontend/src/components/AICapabilities.jsx`

New section `id="ai"`, placed between Projects and Skills in `Home.jsx`.
`SectionHeader` label "ai/ml", title in the site's voice (e.g. "What I do with AI").
Four capability cards in a 2-column grid (1 column below 1024px), reusing the
existing spotlight-glow card borders, 4px hover lift, and staggered `Reveal`
animations. Copy voice: chill but professional, human, no em dashes.

Cards:

1. **LLM Integration & Agents** — tool-calling chatbot on AWS Bedrock (the hero
   terminal on this site), Gemini integrations in ProPosture and MyLesion, prompt
   engineering. Chips: Claude, Gemini, AWS Bedrock, Tool Calling.
2. **MCP Servers** — the custom MCP server behind this portfolio, exposing
   DynamoDB-backed portfolio tools. Chips: MCP, Node.js, DynamoDB.
3. **NLP & Model Fine-Tuning** — BERTweet fine-tunes, stance detection, topic
   modeling, Hugging Face deploys. Chips: BERTweet, Hugging Face, Topic Modeling.
4. **Computer Vision** — MediaPipe pose pipeline, EfficientNetB0 CNN trained on
   46k+ clinical images. Chips: MediaPipe, EfficientNetB0, TensorFlow.

Navbar (`portfolio.js` `navLinks`): insert `{ href: '#ai', label: 'ai', num: '02' }`
and renumber skills 03, background 04, recognition 05, contact 06.

### Dedupe

`BERT` is removed from `skills.tools` in `portfolio.js` (the only frontend dupe).
The languages row is untouched.

## 4. Database + MCP server

- **`backend/scripts/seed.js`**: move AI skills to `category: 'ai'` (BERT,
  BERTweet, MediaPipe, EfficientNetB0, Hugging Face, Gemini, Claude, gTTS,
  AWS Bedrock) and add new skills: MCP (Model Context Protocol), Prompt
  Engineering, Tool Calling. SK naming scheme unchanged.
- **`backend/mcp-server/tools/getSkills.js`**: add `'ai'` to the category enum
  and mention it in the tool description.
- **`backend/mcp-server/tools/tools.test.js`**: cover the `ai` category filter.
- Check the Lambda chat system prompt (`backend/lambda/chat.js` / `config.js`)
  for skill-category or class-standing mentions and update to match.
- After merge, re-run the seed script against DynamoDB (owner action; not
  runnable from this environment).

## 5. Small fixes

- **Senior year**: `Hero.jsx` boot line becomes
  `uptime: senior year · graduating june 2027`. Sweep seed data and lambda
  prompt for any other class-standing mentions.
- **Mobile pull chain** (`global.css`, `PullChain.jsx`):
  - `touch-action: none` on `.chain-hit` so a touch drag grabs the chain
    instead of scrolling the page (the root cause of the swipe-up bug).
  - Larger hit radius on coarse pointers: effective touch target ~42px
    diameter (up from ~30px on small screens). Visuals unchanged.

## Error handling

- All sfx calls are wrapped so a missing/failed AudioContext silently no-ops.
- Rate limiting on `thud()` and `key()` prevents audio spam from fast events.

## Testing / verification

- Backend: `node --test` (existing tools.test.js) passes with the new category.
- Frontend: production build succeeds (watch for the rolldown native binding
  gotcha on this machine).
- Playwright pass, desktop + mobile viewport: chain drag toggles theme on
  mobile without scrolling; AI section renders with animations; nav anchors
  land correctly; no console errors.
