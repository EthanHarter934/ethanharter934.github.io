import 'dotenv/config';
import { BatchWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../mcp-server/db/dynamoClient.js';

const items = [
  // ── Projects ──────────────────────────────────────────────────────────────
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

    // Backend Frameworks
    { name: 'Node.js', category: 'framework', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    { name: 'Express', category: 'framework', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    { name: 'FastAPI', category: 'framework', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },

    // Real-time Communication
    { name: 'Socket.io', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 1 },

    // AWS Services
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
      gpa: 3.95,
      relevantCoursework: [
        'Machine Learning & Data Mining',
        'Parallel Programming',
        'Operating Systems',
        'Algorithms',
        'Data Structures',
        'Intro to Security',
        'Software Engineering',
        'Intro to Databases',
        'Data Structures',
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
      endDate: null,
      current: true,
      description: 'Serve as an officer for Oregon State University\'s Men\'s Volleyball Club, leading operations, organizing events, and supporting team development.',
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
      role: 'Member & Officer',
      startDate: '2023-09',
      endDate: null,
      current: true,
      description: 'Vice president and active member/officer of OSU\'s Men\'s Volleyball Club. Leadership role managing club operations, recruiting, and building competitive team culture.',
    },
  },
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
