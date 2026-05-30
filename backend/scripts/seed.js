import 'dotenv/config';
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../mcp-server/db/dynamoClient.js';

// TODO: replace with your real data — update entries below before running against production

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
        'Local React and Python desktop application for real-time, privacy-focused posture monitoring using MediaPipe Pose, gTTS, VoxCPM2, and Gemini. Won 1st Place in the Computer Vision track at the 2026 AI for Good Hackathon.',
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
        'Full-stack dual-AI skin condition analyzer with FastAPI, EfficientNetB0 CNN trained on 46,000+ clinical images, and Gemini 3.1 Flash Lite for plain-English dermatology reports. Built for the 2026 BeaverHacks Hackathon Computer Vision track.',
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
        'Collaborative research project analyzing public opinion on gun control across Twitter posts using BERTweet and topic modeling. Aiming to publish findings.',
      techStack: ['Python', 'BERTweet'],
      githubUrl: 'https://github.com/EthanHarter934',
      liveUrl: null,
      year: 2025,
      featured: false,
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'PROJECT#emotion-theme-classifiers',
    type: 'project',
    data: {
      title: 'Emotion and Theme Classifiers',
      description:
        'Two BERTweet models predicting emotion and themes in Twitter text, with a web interface deployed on Hugging Face.',
      techStack: ['Python', 'BERTweet', 'Hugging Face'],
      githubUrl: 'https://github.com/EthanHarter934/AI-ML-Project-2025',
      liveUrl: null,
      year: 2025,
      featured: false,
    },
  },
  {
    PK: PROFILE_PK,
    SK: 'PROJECT#recipedia',
    type: 'project',
    data: {
      title: 'Recipedia (Software Engineering Final Project)',
      description:
        'Recipe management website built with React using Agile/Scrum, with three microservices for authentication, recipes, and ingredients.',
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
        'Node.js website managing sales for a fictional game store with a SQL database and full CRUD operations across six entities.',
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
        'Multiplayer Telestrations-inspired drawing game with Node.js and Socket.io. Inducted into the CS290 Hall of Fame.',
      techStack: ['Node.js', 'Socket.io', 'HTML', 'CSS', 'JavaScript'],
      githubUrl: 'https://github.com/osu-cs290-f24/final-project-the-dominators',
      liveUrl: null,
      year: 2025,
      featured: false,
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
    { name: 'BERT', category: 'framework', proficiencyLevel: 'advanced', yearsOfExperience: 2 },
    { name: 'React', category: 'framework', proficiencyLevel: 'advanced', yearsOfExperience: 2 },
    { name: 'Node.js', category: 'framework', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    { name: 'MySQL', category: 'tool', proficiencyLevel: 'intermediate', yearsOfExperience: 2 },
    { name: 'GitHub', category: 'tool', proficiencyLevel: 'advanced', yearsOfExperience: 3 },
    { name: 'VSCode', category: 'tool', proficiencyLevel: 'advanced', yearsOfExperience: 4 },
    { name: 'Unity', category: 'tool', proficiencyLevel: 'beginner', yearsOfExperience: 1 },
    {
      name: 'Linux SSH Servers',
      category: 'tool',
      proficiencyLevel: 'intermediate',
      yearsOfExperience: 2,
    },
  ].map((skill, idx) => ({
    PK: PROFILE_PK,
    SK: `SKILL#${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tool-${idx}`,
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
        'Software Engineering',
        'Intro to Databases',
        'Data Structures',
      ],
    },
  },
];

async function seed() {
  console.log(`Seeding ${items.length} items into ${TABLE_NAME} (PK: ${PROFILE_PK})...`);

  const batchSize = 25;
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
