export const profile = {
  name: 'Ethan Harter',
  firstName: 'Ethan',
  lastName: 'Harter',
  title: 'Computer Science Student | AI Focus',
  school: 'Oregon State University',
  photo: '/Images/Ethan Sunset Pic (1).jpg',
  email: 'hartere@oregonstate.edu',
  stats: [
    { value: '3.95', label: 'gpa @ osu' },
    { value: '2×', label: '1st place wins' },
    { value: '2027', label: 'graduating june' },
  ],
};

export const navLinks = [
  { href: '#work', label: 'work', num: '01' },
  { href: '#ai', label: 'ai', num: '02' },
  { href: '#skills', label: 'skills', num: '03' },
  { href: '#background', label: 'background', num: '04' },
  { href: '#recognition', label: 'recognition', num: '05' },
  { href: '#contact', label: 'contact', num: '06' },
];

export const contactLinks = [
  { href: 'mailto:hartere@oregonstate.edu', kind: 'email', label: 'Email' },
  { href: 'https://linkedin.com/in/ethan-harter236', kind: 'linkedin', label: 'LinkedIn' },
  { href: 'https://github.com/EthanHarter934', kind: 'github', label: 'GitHub' },
  { href: '/CS_AI Resume.pdf', kind: 'resume', label: 'Resume' },
];

export const education = {
  institution: 'Oregon State University',
  date: 'Expected June 2027',
  degree: "Bachelor's in Computer Science, focus in AI",
  gpa: '3.95 GPA',
  notableClasses: [
    'Machine Learning & Data Mining',
    'Parallel Programming',
    'Operating Systems',
    'Algorithms',
    'Software Engineering',
    'Intro to Databases',
    'Data Structures',
  ],
};

export const skills = {
  languages: ['Python', 'JavaScript', 'HTML/CSS', 'SQL', 'C++', 'C#', 'C', 'Assembly', 'R', 'Java', 'TypeScript'],
  tools: ['React', 'Node.js', 'Linux SSH Servers', 'MySQL', 'GitHub', 'VSCode', 'Unity', 'AWS', 'Docker', 'FastAPI'],
};

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

export const experience = [
  {
    title: 'Bonneville Power Administration, ASE Internship',
    date: 'June 2021 to August 2021',
    description: [
      'Redesigned ',
      { highlight: '30+ animations' },
      ' for technical training materials, working with engineers to make sure each one actually showed the right thing. Wrapped up the summer by ',
      { highlight: 'presenting my process at a symposium' },
      ' so the other interns could steal my tricks.',
    ],
  },
];

export const projects = [
  {
    name: 'ProPosture',
    stack: 'Python · React · MediaPipe',
    year: '2026',
    image: '/Images/ProPosture.png',
    alt: 'ProPosture posture-monitoring app interface',
    githubUrl: 'https://github.com/EthanHarter934/ProPosture',
    award: '1st place · 2026 AI for Good Hackathon',
    detTag: 'posture_detected',
    description: [
      'A desktop app that watches your posture through your webcam and calls you out (nicely) when you slouch. Everything runs locally: ',
      { highlight: 'MediaPipe Pose' },
      ' checks you against your own calibrated baseline, and a custom voice coach built on ',
      { highlight: 'gTTS' },
      ', ',
      { highlight: 'VoxCPM2' },
      ', and ',
      { highlight: 'Gemini' },
      ' does the talking. My team took ',
      { highlight: '1st place' },
      ' in the Computer Vision track with it.',
    ],
  },
  {
    name: 'MyLesion',
    stack: 'Python · FastAPI · TensorFlow',
    year: '2026',
    image: '/Images/MyLesion.png',
    alt: 'MyLesion skin-condition analyzer interface',
    githubUrl: 'https://github.com/willarsa/TheDOMinators2026',
    detTag: 'lesion_classified',
    description: [
      'A skin condition analyzer we built for the ',
      { highlight: '2026 BeaverHacks Hackathon' },
      '. Drop in a photo and an ',
      { highlight: 'EfficientNetB0 CNN' },
      ' trained on ',
      { highlight: '46,000+ clinical images' },
      ' classifies it across 7 conditions, then ',
      { highlight: 'Gemini' },
      ' translates the output into a report you can actually read. Built fast, under real deadline pressure, with my team TheDOMinators.',
    ],
  },
  {
    name: 'Social Media Stance Analysis',
    stack: 'Python · BERTweet',
    year: '2025',
    image: '/Images/stance-analysis.svg',
    alt: 'Abstract network graph representing clustered stance groups in social media discourse',
    paperUrl: null,
    detTag: 'stance_inferred',
    description: [
      'Ongoing research with a team looking at how people actually talk about gun control on Twitter. We use ',
      { highlight: 'BERTweet' },
      ' and ',
      { highlight: 'topic modeling' },
      ' to group tweets and figure out where each side stands, and the goal is to ',
      { highlight: 'publish a paper' },
      ' on what we find.',
    ],
  },
  {
    name: 'Emotion & Theme Classifiers',
    stack: 'Python · Hugging Face',
    year: '2025',
    image: '/Images/emotion-theme-classifiers.png',
    alt: 'Emotion and theme classifier web interface',
    githubUrl: 'https://github.com/EthanHarter934/AI-ML-Project-2025',
    detTag: 'emotion_predicted',
    description: [
      'Two ',
      { highlight: 'BERTweet' },
      " models that read a chunk of text and guess the main emotion and themes behind it, trained on Twitter data from late 2024. There's a live web app on ",
      { highlight: 'Hugging Face' },
      ' where you can try them yourself.',
    ],
  },
  {
    name: 'Recipedia',
    stack: 'React · Microservices',
    year: '2025',
    image: '/Images/Recipedia.png',
    alt: 'Recipedia recipe management site',
    githubUrl: 'https://github.com/EthanHarter934/CS361-Main-Program',
    detTag: 'recipe_indexed',
    description: [
      'A recipe manager my team built with ',
      { highlight: 'React' },
      ' while running a real ',
      { highlight: 'Agile/Scrum' },
      ' process. Three microservices handle auth and recipe storage, and we baked in accessibility heuristics from day one (pun intended).',
    ],
  },
  {
    name: 'Punk Games Store',
    stack: 'Node.js · SQL',
    year: '2025',
    image: '/Images/Punk Games.png',
    alt: 'Punk Games store management site',
    githubUrl: 'https://github.com/EthanHarter934/CS340-Team79-Final-Project',
    detTag: 'inventory_tracked',
    description: [
      'A storefront manager for a fictional game shop, built on ',
      { highlight: 'Node.js' },
      ' and a ',
      { highlight: 'SQL database' },
      '. Full ',
      { highlight: 'CRUD' },
      ' across six entities (including a many-to-many), polished over the term with feedback from classmates.',
    ],
  },
  {
    name: 'Depiction',
    stack: 'Node.js · Socket.io',
    year: '2025',
    image: '/Images/Depiction.png',
    alt: 'Depiction multiplayer drawing game',
    githubUrl: 'https://github.com/osu-cs290-f24/final-project-the-dominators',
    award: 'CS290 Hall of Fame',
    detTag: 'drawing_synced',
    description: [
      'A multiplayer drawing game inspired by Telestrations, built with two friends on ',
      { highlight: 'Node.js' },
      '. Lobbies, prompts, and drawings all sync in real time over ',
      { highlight: 'Socket.io' },
      '. It made the ',
      { highlight: 'CS290 Hall of Fame' },
      ' for going past the project requirements.',
    ],
  },
];

export const awards = [
  {
    title: 'First Place, 2026 AI for Good Hackathon',
    date: 'May 2026',
    gold: true,
    description:
      'Took 1st in the Computer Vision track with ProPosture, our real-time posture coaching app that runs entirely on-device.',
  },
  {
    title: 'First Place, OSU AI Club Project Competition',
    date: 'December 2025',
    gold: true,
    description:
      'Won 1st at the OSU AI Club Project Competition, judged on technical innovation and model performance.',
  },
  {
    title: 'CS290 Hall of Fame',
    date: 'December 2024',
    description:
      'Our multiplayer drawing game made the course Hall of Fame for going well past the project requirements.',
  },
  {
    title: 'OSU Honor Roll',
    date: 'September 2023 to Present',
    description: 'On the list every term since starting at OSU by keeping my GPA above 3.5.',
  },
  {
    title: 'Finley Academic Excellence Scholarship',
    date: 'September 2023 to Present',
    description:
      'Awarded for academic performance at OSU. I take the hard classes on purpose, and this one made that feel worth it.',
  },
  {
    title: 'Best Presentation',
    date: 'December 2023',
    description:
      'Earned in a reverse engineering class. I care a lot about making complicated things easy to follow.',
  },
];

export const extracurriculars = [
  { title: 'OSU Artificial Intelligence Club', date: '2025 - present' },
  { title: "OSU Men's Volleyball Club Officer", date: '2023 - present' },
  { title: 'Chaos Club Volleyball', date: '2022-2023' },
  { title: 'Grant High School Baseball', date: '2019-2022' },
];
