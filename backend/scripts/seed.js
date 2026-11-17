import 'dotenv/config';
import { BatchWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../mcp-server/db/dynamoClient.js';

const items = [
  // ── Projects ──────────────────────────────────────────────────────────────
  {
    PK: PROFILE_PK,
    SK: 'PROJECT#merlins-minty-cards',
    type: 'project',
    featured: true,
    data: {
      title: "Merlin's Minty Cards Platform (Software Engineering Internship)",
      organization: "Merlin's Minty Cards",
      role: 'Software Engineering Intern',
      startDate: '2026-06',
      endDate: '2026-09',
      description:
        "As a software engineering intern at Merlin's Minty Cards, a small Pokémon card business that sells at in-person card shows, Ethan worked with the owners to produce their complete web platform, served at merlinsmintycards.com. AI coding agents (mainly Claude Code) wrote the code. Ethan's role was to direct them: turning the owners' needs into requirements, planning features, designing the workflow and guardrails the AI worked inside, reviewing results, deciding what shipped, and handling deploys and production issues with the AI. The owners report the app speeds up transactions at shows by about 25%. This project shows AI-driven engineering and cloud architecture, not hand-written code.",
      myContributions: [
        "Turning the non-technical owners' needs into requirements and specs, and knowing which decisions belonged to them",
        'Planning features and reviewing an AI-written RFC-style design doc and implementation plan before any code was written',
        'Designing the AI workflow and guardrails (custom skills, custom agents, project rules, hooks)',
        'Reviewing results and deciding what shipped',
        'Deployment and debugging decisions, handling production issues together with the AI',
      ],
      scale: [
        'About 60,000 lines of application code: ~33k frontend TypeScript, ~25k backend Python, plus the MCP server and infrastructure code (as of Sept 2026)',
        'About 127 backend API endpoints',
        '4,200+ automated tests: 2,534 backend, 1,512 frontend, 113 MCP server, 45 infrastructure',
        '27 design documents (RFCs), 29 merged pull requests, 566 commits',
        'A card catalog of about 29,000 English and Japanese Pokémon cards',
      ],
      architecture: [
        'Frontend: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS. Login through NextAuth v5 with AWS Cognito. Articles and a beginner glossary managed in Sanity CMS with the editor embedded in the site. Public pages use incremental static regeneration (pre-built and refreshed on a timer).',
        "Backend: Python FastAPI with Pydantic models. Cognito login tokens are checked on every request, and the user's Cognito groups decide admin versus customer access. The AI chat has three layers of rate limits: per user per minute, per user per day, and a global daily cap to bound AI costs.",
        'Database: one DynamoDB table (single-table design) with two secondary indexes holding inventory, the card catalog, transactions, shows, consignors, price history and chat conversations. Multi-item money operations use DynamoDB transactions so they save completely or not at all. Old data expires automatically through DynamoDB TTL.',
        'AI: Claude on AWS Bedrock with tool use through the Model Context Protocol (MCP), in two separate chat systems. Customer chat is a TypeScript MCP server with 7 tools (inventory search, valuation, price history, an underpriced-card finder, and tools that display cards visually instead of describing them in text). Admin analyst chat is a separate Python MCP server with 9 read-only tools (profit summaries, aging stock, consignor positions, pricing outliers, raw data listings, and search over the admin docs).',
        'The two chat systems are kept apart structurally (separate processes, tool lists and system prompts) so the customer chat cannot reach admin data. Conversations are stored on the server so they persist across devices and cannot be tampered with by the client.',
        'Outside data: TCGdex API for the card catalog and market prices; PokemonPriceTracker API for graded-card prices (its free tier allows about 50 lookups a day, so lookups are budgeted); generated TCGplayer and eBay sold-listings links for each card.',
      ],
      awsInfrastructure: [
        'Everything defined as code in AWS CDK (TypeScript), split into 4 stacks',
        'Lambda: backend API as a container image (via the Lambda Web Adapter), and the Next.js server via OpenNext',
        'CloudFront + ACM: serves the website with the custom domain and SSL certificate',
        'DynamoDB: main database',
        'Cognito: customer and admin login with a branded login page (its own stack)',
        'Bedrock: runs Claude for both chat systems',
        'ECS Fargate + EventBridge Scheduler: nightly price sync and monthly catalog sync (its own stack)',
        'SQS: dead-letter queue that catches failed scheduled runs',
        'IAM and CloudWatch: least-privilege permissions per stack, and logging',
        'Deploy scripts carry forward existing secrets automatically, and a smoke-test script checks the live deployment after every deploy',
      ],
      features: [
        'Public site: home page with featured cards from real inventory, show schedule, about page, collector glossary, articles',
        'Customer inventory search: a split screen with filters (set, condition, rarity, price, name) or AI chat on the left and a shared card grid on the right. Customers only see cards that have a sticker price.',
        'Admin panel: 17 pages in three sidebar groups ("At the show", "Back office", "Data")',
        'Buy / Sell / Trade: one deal screen with three modes for building multi-card deals. It calculates trade balances and the cost of incoming cards automatically, and a "customer view" mode hides margins when the screen faces the customer.',
        'Graded-card ("slab") intake: works with a barcode scanner, flags duplicate certificate numbers, derives grade labels automatically, and prices cards nightly',
        'Inventory table: every column can be sorted, filtered and edited in place, with undo',
        'Triage and Unmatched queues for fixing bad data and cards missing from the catalog',
        'Show analytics: multi-day events grouped under one show',
        'Transaction history: profit per item, trade history shown as a graph, and corrections through voids or edits with an audit trail (never deletion)',
        'Consignor management: payout terms and wishlists',
        'Docs: a searchable operations knowledge base',
        'AI analyst: a slide-over chat available on every admin page',
      ],
      aiWorkflow: [
        'Model choice: Claude Code throughout, with more capable models for planning and design and cheaper ones for mechanical implementation and test runs',
        'Design before code: for each substantial feature the AI wrote an RFC-style design doc and implementation plan, which Ethan reviewed before any code was written',
        'Enforced test-driven development: project instructions require failing tests first and a stop for Ethan\'s confirmation before implementing; a hook runs the test suite after every file edit',
        '10 custom skills Ethan created: design-doc (architecture RFCs), initialize-roadmap (audits the project and writes a progress file), tdd (test-first implementation), testing (confirms a passing test run is real), adversarial-review (the AI critiques its own plans and changes for logic, security, failure modes and unnecessary complexity), first-hand-evidence (check the real result before calling work done), sync-docs (keeps documentation matched to code), pr-description (fills the PR template from the diff), lesson-capture (turns mistakes into lasting rules), skill-curator (periodic cleanup of the skill library)',
        'Third-party skills were also used (a web design guidelines skill, a skill-writing guide, and a pack of design skills); Ethan did not write those',
        '3 custom agents: a test-QA agent and a web-research agent, both on a cheaper model so heavy output stays out of the main conversation, plus a default agent that keeps the lesson-capture habit active in every session',
        'Lessons-learned loop: every mistake became a general rule in the project instructions file (CLAUDE.md, about 3,500 lines). Rules that kept being broken were made enforceable by tests or automated checks, because the AI knowing a rule is not enough.',
        'Managing context and autonomy: the AI tracks how much of its context window it has used and stops at a clean point with a handoff file for the next session. Written rules say when the AI must ask a human (spending money, irreversible production changes, changing a feature\'s purpose) and when it should decide on its own and record why. Destructive git commands are banned during investigation.',
        'Professional GitHub setup: branch-based work with pull requests, a PR template and CODEOWNERS review; GitHub Actions CI running tests, lint and builds for every part of the app; Dependabot and a security policy',
      ],
      challenges: [
        'Moving the business off spreadsheets: the first import linked only about 7% of available inventory to the card catalog because card numbers were not normalized (Excel turned "181" into "181.0"). The matcher was fixed, and a safely re-runnable import was built that loads a complete new copy of the data before removing the old one and flags uncertain rows for a human.',
        'Choosing a card data source: the catalog moved from pokemontcg.io to TCGdex with a two-tier design. Card identities for the whole catalog load in one bulk request; detailed prices are fetched only for cards the business owns, about 300 requests a day instead of about 35,000.',
        'Catalog search took 11 seconds per keystroke because every search scanned the whole database table. An in-memory cache on the server fixed it.',
        'Migrating from ECS to serverless (the biggest architecture change): AWS cost data showed about $87/month, 99% of it always-on infrastructure (two Fargate containers, a load balancer, public IP addresses) for traffic that only spikes at evening card shows. The app moved to Lambda (backend) and CloudFront plus Lambda (frontend), running alongside the old version before the switch-over.',
        'Removing ECS also broke the scheduled price-sync jobs, which then failed silently for over 15 days before anyone noticed. They were rebuilt as their own CDK stack with a dead-letter queue and a verification script.',
        'Silent deployment failures, where deploys reported success while production was broken: a CDK value transformed with ordinary string code before it existed added a double slash to every API URL (every request returned 404 and the whole site was down); a deploy with only some secrets exported silently deleted the rest from the live server, breaking login; a manual Docker rebuild used the wrong build stage so every request timed out; a missing permission crashed the nightly sync at the end of its first step every night, hidden because owned-card prices still updated while the other five steps never ran. Each became a script or check: deploy scripts that preserve existing secrets, post-deploy smoke tests, and tests on the generated CloudFormation output.',
        'A paid API pulled mid-project: the PSA grading-certificate API became a paid feature the owners declined. Slab intake was redesigned to be manual-first with barcode-scanner support. Graded prices come from a free-tier API, and a price is attached only when the vendor\'s catalog ID exactly matches the card, because its name search returned the wrong card about a third of the time.',
        'Getting the money right: the trade screen showed +$1,800 on a trade that actually balanced to $0 because cash was added instead of subtracted in the displayed balance; trade history silently dropped cards in multi-card trades, understating profit, and was rebuilt as a graph; customer prices switched from a condition-adjusted market estimate to the price actually on the card\'s sticker.',
        'Making the AI chat trustworthy: the chat originally described cards in prose, which invited made-up prices, so it was changed to display real card data visually. The browser originally sent the whole chat history on every request, so a user could have forged the AI\'s past replies; history moved to the server. The admin analyst kept asking for exact dates because its tool definitions had empty parameter descriptions, and the existing test only checked parameter names so it never caught this.',
        'Rules that kept slipping: "every table column is sortable" was fixed by hand three times and columns were missed every time. The fix was to make the table component itself reject any column without an explicit sort decision.',
        'Security clean-up: an early static admin API key built for a Retool admin prototype was still accepted on a publicly reachable endpoint; it was removed so Cognito is the only way in. An npm audit found 41 dependency advisories (5 critical, including two on the login path); the fixable ones were patched and Dependabot was added.',
      ],
      lessonsLearned: [
        "How to plan and direct AI agents on a real product for real users with real money at stake, and how to build guardrails so the AI's mistakes don't repeat",
        "Practical AWS: serverless versus container cost trade-offs, infrastructure as code, IAM, and the fact that a successful deploy doesn't prove the site works",
        'Designing AI features with clear security boundaries',
        "Translating non-technical owners' requests into specs, and knowing which decisions belong to them",
      ],
      assistantGuidance:
        "Be clear that the code was AI-written under Ethan's direction; his contributions were requirements, planning, workflow design, review, and deployment and debugging decisions. Answer only from the facts in this record. If something isn't covered, say you don't know and suggest contacting Ethan directly. Don't claim Ethan hand-wrote code or has deep expertise in a specific language from this project.",
      techStack: [
        'Claude Code',
        'Next.js 15',
        'React 18',
        'TypeScript',
        'Tailwind CSS',
        'NextAuth',
        'Sanity CMS',
        'Python',
        'FastAPI',
        'Pydantic',
        'MCP (Model Context Protocol)',
        'AWS CDK',
        'AWS Lambda',
        'AWS CloudFront',
        'AWS DynamoDB',
        'AWS Cognito',
        'AWS Bedrock',
        'AWS ECS Fargate',
        'AWS EventBridge',
        'AWS SQS',
        'GitHub Actions',
      ],
      githubUrl: null,
      liveUrl: 'https://merlinsmintycards.com',
      year: 2026,
      featured: true,
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'PROJECT#proposture',
    type: 'project',
    featured: true,
    data: {
      title: 'ProPosture',
      description:
        "Built for the 2026 AI for Good Hackathon (1st Place), ProPosture is a privacy-first posture coaching application that runs entirely on the user's local machine. The app is built as a desktop application using React on the frontend and Python on the backend, with all processing happening locally so no video or personal data ever leaves the device. At its core, the system uses MediaPipe Pose to analyze a live webcam feed in real time, extracting key skeletal landmarks from the user's body each frame. Rather than comparing against a generic posture standard, it lets users calibrate their own 'good posture' baseline, so the system judges relative to the individual. When posture deviates from that baseline, a spoken coaching system kicks in, generating contextual audio feedback by combining Google's gTTS for text-to-speech, VoxCPM2 for voice quality, and Gemini for prompt optimization to make the coaching feel natural and helpful rather than robotic.",
      techStack: ['Python', 'React', 'HTML', 'CSS', 'JavaScript', 'MediaPipe', 'gTTS', 'Gemini'],
      githubUrl: 'https://github.com/EthanHarter934/ProPosture',
      liveUrl: null,
      year: 2026,
      featured: true,
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'PROJECT#mylesion',
    type: 'project',
    featured: true,
    data: {
      title: 'MyLesion',
      description:
        "Developed at the 2026 BeaverHacks Hackathon, MyLesion is a full-stack skin condition analysis tool that combines a custom-trained deep learning model with AI-generated plain-English explanations. The backend is powered by FastAPI and serves a custom EfficientNetB0 convolutional neural network that was trained on over 46,000 clinical dermatology images, enabling it to classify input images into 7 distinct skin condition categories with meaningful accuracy. The frontend features a responsive drag-and-drop interface built in JavaScript that makes uploading images straightforward. Once the CNN produces its classification output, that result is passed to Gemini 3.1 Flash Lite, which interprets the model's confidence scores and generates a dermatology report written in accessible, non-technical language, bridging the gap between raw ML output and something a general user can actually act on.",
      techStack: ['Python', 'JavaScript', 'FastAPI', 'EfficientNetB0', 'Gemini'],
      githubUrl: 'https://github.com/willarsa/TheDOMinators2026',
      liveUrl: null,
      year: 2026,
      featured: true,
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'PROJECT#social-media-stance-analysis',
    type: 'project',
    data: {
      title: 'Social Media Stance Analysis',
      description:
        "This ongoing research project uses NLP to study how public opinion on gun control is expressed and divided across Twitter. Working with a team, the project applies BERTweet, a BERT-based model pretrained specifically on Twitter data, to a corpus of tweets to perform two complementary tasks: topic modeling to group tweets into meaningful clusters, and stance detection to identify which side of the debate each cluster represents. The goal is to move beyond simple sentiment analysis and map the actual structure of the discourse, who is saying what, and how the opposing sides frame their arguments. The project is aimed at producing a publishable academic paper presenting the findings.",
      techStack: ['Python', 'BERTweet'],
      githubUrl: 'https://github.com/EthanHarter934',
      liveUrl: null,
      year: 2025,
      featured: true,
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'PROJECT#emotion-theme-classifiers',
    type: 'project',
    data: {
      title: 'Emotion and Theme Classifiers',
      description:
        "This project involved fine-tuning two separate BERTweet models on a labeled dataset of late-2024 Twitter data: one to classify the primary emotion expressed in a tweet (e.g., anger, joy, fear), and another to identify its dominant theme. Both models were trained using standard transformer fine-tuning workflows in Python and then hosted on HuggingFace for public access. A web interface was built on top of the HuggingFace API, letting users type or paste a tweet and receive live predictions from both models simultaneously. The project was awarded 1st Place at the OSU AI Club Project Competition, recognized specifically for its technical innovation and the quality of model performance.",
      techStack: ['Python', 'BERTweet', 'Hugging Face'],
      githubUrl: 'https://github.com/EthanHarter934/AI-ML-Project-2025',
      liveUrl: null,
      year: 2025,
      featured: true,
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'PROJECT#recipedia',
    type: 'project',
    data: {
      title: 'Recipedia (Software Engineering Final Project)',
      description:
        "Recipedia is a full-stack recipe management web application built with React, developed using an Agile/Scrum workflow with regular sprints, stand-ups, and iterative delivery. Rather than a monolithic backend, the project is supported by three dedicated microservices handling distinct responsibilities: user authentication, recipe storage, and ingredient storage, keeping concerns separated and the system easier to maintain and scale. Users can create, organize, and manage their personal recipe collections through the interface. A deliberate focus was placed on accessibility and usability throughout development, with inclusivity heuristics guiding design decisions around things like color contrast, keyboard navigability, and clear labeling, ensuring the app is usable by a broad range of people, not just the default case.",
      techStack: ['React', 'HTML', 'CSS', 'JavaScript'],
      githubUrl: 'https://github.com/EthanHarter934/CS361-Main-Program',
      liveUrl: null,
      year: 2025,
      featured: false,
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'PROJECT#punk-games',
    type: 'project',
    data: {
      title: 'Punk Games (Databases Final Project)',
      description:
        "This project is a full-stack inventory and sales management system for a fictional physical game store, built with Node.js on the backend and a SQL relational database at its core. The schema models six distinct entities, such as games, customers, employees, transactions, and more, including a many-to-many relationship handled through a junction table, reflecting real-world relational database design. For each entity, the app implements full CRUD functionality (create, read, update, delete) through a web interface built with HTML, CSS, and JavaScript, giving users complete control over the store's data. The project went through multiple rounds of iteration based on structured peer feedback from classmates, with each cycle improving both the usability of the interface and the integrity and efficiency of the underlying database design.",
      techStack: ['Node.js', 'SQL', 'HTML', 'CSS', 'JavaScript'],
      githubUrl: 'https://github.com/EthanHarter934/CS340-Team79-Final-Project',
      liveUrl: null,
      year: 2025,
      featured: false,
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'PROJECT#depiction',
    type: 'project',
    data: {
      title: 'Depiction (Web Development Final Project)',
      description:
        "Built as the final project for OSU's CS290 Web Development course, this is a real-time multiplayer drawing game inspired by the party game Telestrations. Developed in a team of three using Node.js and Socket.io, the game allows multiple players to join shared lobbies and pass drawings and written prompts back and forth in sequence, each player only seeing the previous step, creating a chain of creative telephone-style miscommunication. Socket.io handles all real-time bidirectional communication between clients and the server, managing lobby creation, turn sequencing, and the transmission of both text prompts and canvas drawing data. The project was inducted into the CS290 Hall of Fame for exceeding the expectations of the course guidelines.",
      techStack: ['Node.js', 'Socket.io', 'HTML', 'CSS', 'JavaScript'],
      githubUrl: 'https://github.com/osu-cs290-f24/final-project-the-dominators',
      liveUrl: null,
      year: 2025,
      featured: false,
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'PROJECT#personal-portfolio',
    type: 'project',
    featured: false,
    data: {
      title: 'Personal Portfolio',
      description:
        "Production-grade full-stack portfolio website featuring an AI-powered chatbot that provides natural language Q&A about projects, skills, experience, and education. Built with React 19 frontend (Vite 8 bundler) and Node.js 20 Express 5 backend, deployed serverless on AWS Lambda with API Gateway HTTP integration. The chatbot uses Claude Haiku 4.5 via AWS Bedrock with tool-calling architecture, when users ask questions, Claude intelligently decides which tools to invoke (getProjects, getSkills, getExperience, getEducation, searchPortfolio) to ground responses in real portfolio data from DynamoDB. Core technical achievements: (1) Security & validation: input sanitization enforces message count (50 max), content length (4096 chars), role validation; rate limiting middleware prevents abuse (20 req/min per IP); CORS configured for CloudFront domain. (2) Performance optimizations: 5-minute TTL caching reduces DynamoDB calls 30-40%; tool result deduplication within chat sessions speeds follow-ups 50-70%; lazy-loaded frontend components improve initial page load 15-25%. (3) Cost optimization: uses cheapest Claude model with 1024 token cap (~$0.001 per exchange), runs on Lambda free tier (1M requests/month), on-demand DynamoDB billing, total infrastructure cost ~$3/month. (4) Quality & testing: 6 unit tests cover tool filtering and data transformation; structured JSON logging for CloudWatch; centralized configuration management; comprehensive error handling. Infrastructure: Lambda (512MB, 30s timeout, Node.js 20.x), API Gateway HTTP with CORS, DynamoDB on-demand with point-in-time recovery, S3 static hosting, CloudFront CDN with Origin Access Control, CloudWatch for observability. Tech stack includes React Router 7 for SPA navigation, React Markdown 10 for formatting AI responses, AWS SDK v3 for all AWS integrations, dotenv for environment configuration. Demonstrates full-stack expertise in frontend UX (React + Vite), backend API design (Express middleware patterns), serverless architecture (Lambda cold start optimization), database design (DynamoDB partition/sort keys), AI integration (Claude tool-calling, prompt engineering), cloud infrastructure (multi-service AWS coordination), security practices (input validation, rate limiting, IAM least-privilege), performance engineering (caching strategies, code splitting), and software quality (testing, logging, documentation).",
      techStack: [
        'React 19',
        'Vite 8',
        'React Router 7',
        'React Markdown 10',
        'Node.js 20',
        'Express 5',
        'AWS Lambda',
        'AWS API Gateway',
        'AWS DynamoDB',
        'AWS Bedrock',
        'AWS S3',
        'AWS CloudFront',
        'AWS CloudWatch',
        'Claude Haiku 4.5',
        'RESTful APIs'
      ],
      githubUrl: 'https://github.com/EthanHarter934/ethanharter934.github.io',
      liveUrl: null,
      year: 2026,
      featured: true,
    },
  },

  // ── Skills — Languages ────────────────────────────────────────────────────
  ...[
    { name: 'Python', category: 'language', proficiencyLevel: 'advanced', yearsOfExperience: 4 },
    { name: 'JavaScript', category: 'language', proficiencyLevel: 'advanced', yearsOfExperience: 3 },
    { name: 'HTML/CSS', category: 'language', proficiencyLevel: 'advanced', yearsOfExperience: 3 },
    { name: 'SQL', category: 'language', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    { name: 'C++', category: 'language', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    { name: 'C#', category: 'language', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    { name: 'C', category: 'language', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    { name: 'Assembly', category: 'language', proficiencyLevel: 'beginner', yearsOfExperience: 1 },
    { name: 'R', category: 'language', proficiencyLevel: 'beginner', yearsOfExperience: 1 },
    { name: 'TypeScript', category: 'language', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
  ].map((skill, idx) => ({
    PK: PROFILE_PK,
    SK: `SKILL#${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-lang-${idx}`,
    type: 'skill',
    data: skill,
  })),

  // ── Skills — Tools & Frameworks ───────────────────────────────────────────
  ...[
    // Frontend Frameworks & Tools
    { name: 'React', category: 'framework', proficiencyLevel: 'advanced', yearsOfExperience: 2 },
    { name: 'React Router', category: 'framework', proficiencyLevel: 'advanced', yearsOfExperience: 1 },
    { name: 'React Markdown', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'Vite', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'Next.js', category: 'framework', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },

    // Backend Frameworks
    { name: 'Node.js', category: 'framework', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    { name: 'Express', category: 'framework', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    { name: 'FastAPI', category: 'framework', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },

    // Real-time Communication
    { name: 'Socket.io', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },

    // AWS Services
    { name: 'AWS', category: 'tool', proficiencyLevel: 'advanced', yearsOfExperience: 1 },
    { name: 'AWS Lambda', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'AWS API Gateway', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'AWS DynamoDB', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'AWS S3', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'AWS CloudFront', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },
    { name: 'AWS CloudWatch', category: 'tool', proficiencyLevel: 'beginner', yearsOfExperience: 1 },
    { name: 'AWS SDK', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },

    // Database
    { name: 'MySQL', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    { name: 'SQL', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },

    // Development Tools
    { name: 'GitHub', category: 'tool', proficiencyLevel: 'advanced', yearsOfExperience: 3 },
    { name: 'VSCode', category: 'tool', proficiencyLevel: 'advanced', yearsOfExperience: 4 },
    { name: 'Linux SSH Servers', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    { name: 'Unity', category: 'tool', proficiencyLevel: 'beginner', yearsOfExperience: 1 },
  ].map((skill, idx) => ({
    PK: PROFILE_PK,
    SK: `SKILL#${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tool-${idx}`,
    type: 'skill',
    data: skill,
  })),

  // ── Skills — AI / ML ──────────────────────────────────────────────────────
  ...[
    { name: 'Claude Code', category: 'ai', proficiencyLevel: 'advanced', yearsOfExperience: 1 },
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

  // ── Experience ────────────────────────────────────────────────────────────
  {
    PK: PROFILE_PK,
    SK: 'EXPERIENCE#merlins-minty-cards',
    type: 'experience',
    data: {
      company: "Merlin's Minty Cards",
      role: 'Software Engineering Intern',
      startDate: '2026-06',
      endDate: '2026-09',
      current: false,
      description:
        "Directed Claude Code to build and deploy the business's full-stack AWS sales platform (merlinsmintycards.com), which the owners report speeds up transactions at card shows by about 25%. Designed the AI workflow (10 custom skills, 3 custom agents, and a self-updating rules file), and deployed serverless on AWS with CDK using Lambda, DynamoDB, CloudFront, Cognito, and Bedrock. The code was AI-written under Ethan's direction. See the \"Merlin's Minty Cards Platform\" project (getProjects) for full details.",
      techStack: ['Claude Code', 'AWS CDK', 'AWS Lambda', 'AWS DynamoDB', 'AWS CloudFront', 'AWS Cognito', 'AWS Bedrock'],
      projectId: 'merlins-minty-cards',
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'EXPERIENCE#bpa-internship',
    type: 'experience',
    data: {
      company: 'Bonneville Power Administration',
      role: 'ASE Internship',
      startDate: '2021-06',
      endDate: '2021-08',
      current: false,
      description:
        'Redesigned 30+ animations for technical training materials. Presented work at a symposium to teach other interns the development process.',
      techStack: [],
    },
  },

  // ── Education ─────────────────────────────────────────────────────────────
  {
    PK: PROFILE_PK,
    SK: 'EDUCATION#osu-cs',
    type: 'education',
    data: {
      institution: 'Oregon State University',
      degree: 'B.S. Computer Science, focus in AI',
      graduationYear: 2027,
      gpa: 3.96,
      relevantCoursework: [
        'Intro to AI',
        'Intro to Applied Data Science',
        'Machine Learning & Data Mining',
        'Parallel Programming',
        'Operating Systems',
        'Algorithms',
        'Data Structures',
        'Intro to Security',
        'Software Engineering',
        'Intro to Databases',
      ],
    },
  },

  // ── Sports & Athletics ─────────────────────────────────────────────────────
  {
    PK: PROFILE_PK,
    SK: 'ACTIVITY#baseball-ghs',
    type: 'activity',
    data: {
      name: 'Grant High School Baseball',
      category: 'sports',
      role: 'Junior Varsity Player',
      startDate: '2019-03',
      endDate: '2022-06',
      current: false,
      description: 'Played junior varsity baseball for Grant High School, developing teamwork, discipline, and competitive athleticism.',
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'ACTIVITY#rowing-rose-city',
    type: 'activity',
    data: {
      name: 'Rose City Rowing Club',
      category: 'sports',
      role: 'Rower',
      startDate: '2020-03',
      endDate: '2021-06',
      current: false,
      description: 'Competed in competitive rowing with Rose City Rowing Club, building endurance and rowing ability.',
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'ACTIVITY#volleyball-chaos',
    type: 'activity',
    data: {
      name: 'Chaos Club Volleyball',
      category: 'sports',
      role: 'Player',
      startDate: '2022-09',
      endDate: '2023-06',
      current: false,
      description: 'Played club volleyball at Chaos Club Volleyball, improving volleyball skills and building community.',
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'ACTIVITY#volleyball-mens-player',
    type: 'activity',
    data: {
      name: 'Men\'s Volleyball Club (OSU)',
      category: 'sports',
      role: 'Club Player',
      startDate: '2023-09',
      endDate: null,
      current: true,
      description: 'Actively compete as a player for Oregon State University\'s Men\'s Volleyball Club, participating in league matches and tournaments.',
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'ACTIVITY#volleyball-mens-officer',
    type: 'activity',
    data: {
      name: 'Men\'s Volleyball Club (OSU)',
      category: 'clubs',
      role: 'Club Officer',
      startDate: '2025-01',
      endDate: '2026-06',
      current: false,
      description: 'Served as an officer for Oregon State University\'s Men\'s Volleyball Club, leading operations, organizing events, and supporting team development, before being elected Vice President.',
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'ACTIVITY#volleyball-mens-vp',
    type: 'activity',
    data: {
      name: 'Men\'s Volleyball Club (OSU)',
      category: 'clubs',
      role: 'Vice President',
      startDate: '2026-06',
      endDate: null,
      current: true,
      description: 'Vice President of Oregon State University\'s Men\'s Volleyball Club, after a year as a club officer. Helps lead club operations, recruiting, and team culture.',
    },
  },

  // ── Club Memberships ───────────────────────────────────────────────────────
  {
    PK: PROFILE_PK,
    SK: 'ACTIVITY#club-beaverhacks',
    type: 'activity',
    data: {
      name: 'BeaverHacks Club',
      category: 'clubs',
      role: 'Member',
      startDate: '2024-01',
      endDate: null,
      current: true,
      description: 'Active member of BeaverHacks, Oregon State\'s premier hackathon club. Participate in hackathon events, fostering innovation and collaborative problem-solving.',
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'ACTIVITY#club-ai',
    type: 'activity',
    data: {
      name: 'AI Club',
      category: 'clubs',
      role: 'Member',
      startDate: '2024-01',
      endDate: null,
      current: true,
      description: 'Active member of OSU AI Club, attending workshops, and collaborating on AI projects.',
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'ACTIVITY#club-volleyball',
    type: 'activity',
    data: {
      name: 'Men\'s Volleyball Club',
      category: 'clubs',
      role: 'Member, Officer & Vice President',
      startDate: '2023-09',
      endDate: null,
      current: true,
      description: 'Member of OSU\'s Men\'s Volleyball Club since 2023, club officer in 2025-26, and now Vice President. Leadership role managing club operations, recruiting, and building competitive team culture.',
    },
  },

  // ── Awards ────────────────────────────────────────────────────────────────
  ...[
    {
      id: 'ai-for-good-hackathon-2026',
      title: 'First Place, 2026 AI for Good Hackathon',
      date: 'May 2026',
      description:
        'Took 1st in the Computer Vision track with ProPosture, a real-time posture coaching app that runs entirely on-device.',
      relatedProject: 'proposture',
    },
    {
      id: 'osu-ai-club-competition',
      title: 'First Place, OSU AI Club Project Competition',
      date: 'December 2025',
      description:
        'Won 1st at the OSU AI Club Project Competition for the Twitter Emotion and Theme Classifiers, judged on technical innovation and NLP model performance.',
      relatedProject: 'emotion-theme-classifiers',
    },
    {
      id: 'cs290-hall-of-fame',
      title: 'CS290 Hall of Fame',
      date: 'December 2024',
      description:
        'Depiction, a multiplayer Node.js drawing game built with a team of three, was inducted into the CS290 Hall of Fame for going above and beyond the project guidelines.',
      relatedProject: 'depiction',
    },
    {
      id: 'osu-honor-roll',
      title: 'OSU Honor Roll',
      date: 'September 2023 to Present',
      description: 'On the honor roll every term since starting at OSU by keeping a GPA above 3.5.',
    },
    {
      id: 'finley-scholarship',
      title: 'Finley Academic Excellence Scholarship',
      date: 'September 2023 to Present',
      description: 'Awarded for high academic achievement and rigorous coursework at OSU.',
    },
    {
      id: 'best-presentation',
      title: 'Best Presentation',
      date: 'December 2023',
      description:
        'Earned in a reverse engineering class, reflecting a passion for visual communication and making complicated things easy to follow.',
    },
  ].map(({ id, ...award }) => ({
    PK: PROFILE_PK,
    SK: `AWARD#${id}`,
    type: 'award',
    data: award,
  })),
];

async function seed() {
  console.log(`Seeding ${items.length} items into ${TABLE_NAME} (PK: ${PROFILE_PK})...`);

  const batchSize = 25;

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

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batch.map((item) => ({
            PutRequest: { Item: item },
          })),
        },
      }),
    );

    console.log(`  Wrote items ${i + 1}–${Math.min(i + batchSize, items.length)}`);
  }

  console.log('Seed complete.');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
