// TODO: replace with your real data — this mirrors the current static portfolio content

export const profile = {
  name: 'Ethan Harter',
  title: 'Computer Science Student | AI Focus',
  school: 'Oregon State University',
  photo: '/Images/Ethan Sunset Pic (1).jpg',
};

export const navLinks = [
  { href: '#education', label: 'Education' },
  { href: '#skills', label: 'Skills & Tools' },
  { href: '#experience', label: 'Experience' },
  { href: '#projects', label: 'Projects' },
  { href: '#awards', label: 'Awards' },
  { href: '#extracurriculars', label: 'Extracurriculars' },
];

export const contactLinks = [
  { href: 'mailto:hartere@oregonstate.edu', icon: '/Images/email-icon.png', alt: 'Email' },
  { href: 'https://linkedin.com/in/ethan-harter236', icon: '/Images/linkedin-icon.png', alt: 'LinkedIn' },
  { href: 'https://github.com/EthanHarter934', icon: '/Images/github-icon.png', alt: 'GitHub' },
  { href: '/CS_AI Resume.pdf', icon: '/Images/resume-icon.png', alt: 'Resume' },
];

export const education = {
  institution: 'Oregon State University',
  date: 'Expected June 2027',
  degree: "Bachelor's in Computer Science, focus in AI | GPA: 3.95",
  notableClasses:
    'Notable Classes: Machine Learning & Data Mining, Parallel Programming, Operating Systems, Algorithms, Software Engineering, Intro to Databases, Data Structures',
};

export const skills = {
  languages: ['Python', 'JavaScript', 'HTML/CSS', 'SQL', 'C++', 'C#', 'C', 'Assembly', 'R'],
  tools: ['BERT', 'React', 'Node.js', 'Linux SSH Servers', 'MySQL', 'GitHub', 'VSCode', 'Unity'],
};

export const experience = [
  {
    title: 'Bonneville Power Administration - ASE Internship',
    date: 'June 2021 - August 2021',
    description: [
      'Redesigned ',
      { highlight: '30+ animations' },
      ' for technical training materials. Worked with professionals to make animations more accurately display information. Presented work for a symposium in order to ',
      { highlight: 'teach' },
      ' other interns my development process.',
    ],
  },
];

export const projects = [
  {
    title: 'ProPosture | Python, HTML, CSS, and JavaScript',
    date: '2026',
    image: '/Images/ProPosture.png',
    alt: 'ProPosture',
    githubUrl: 'https://github.com/EthanHarter934/ProPosture',
    description: [
      'Built a local ',
      { highlight: 'React' },
      ' and ',
      { highlight: 'Python' },
      ' desktop application for real-time, privacy-focused posture monitoring. Integrated ',
      { highlight: 'MediaPipe Pose' },
      ' to analyze live webcam feeds locally against user-calibrated baselines. Engineered a custom spoken voice coaching system using ',
      { highlight: 'gTTS' },
      ', ',
      { highlight: 'VoxCPM2' },
      ', and ',
      { highlight: 'Gemini' },
      ' prompt optimization. Developed as a competitive entry for the ',
      { highlight: '2026 AI for Good Hackathon' },
      ', where our team secured ',
      { highlight: '1st Place' },
      ' in the Computer Vision track. We worked under a strict deadline to architect the local CV pipeline and pitch the application\'s real-time ergonomic benefits to the judges.',
    ],
  },
  {
    title: 'MyLesion | Python and Javascript',
    date: '2026',
    image: '/Images/MyLesion.png',
    alt: 'MyLesion',
    githubUrl: 'https://github.com/willarsa/TheDOMinators2026',
    description: [
      'Built a full-stack dual-AI skin condition analyzer featuring ',
      { highlight: 'FastAPI' },
      ' and a responsive drag-and-drop UI. Trained an ',
      { highlight: 'EfficientNetB0 CNN' },
      ' on over ',
      { highlight: '46,000 clinical images' },
      ' to accurately classify 7 distinct skin conditions. Integrated ',
      { highlight: 'Gemini 3.1 Flash Lite' },
      ' to process model outputs and generate plain-English dermatology reports. Created alongside my team, TheDOMinators, as our submission for the Computer Vision track of the ',
      { highlight: '2026 BeaverHacks Hackathon' },
      '. This event challenged us to rapidly prototype and integrate our custom CNN with a generative AI API under extreme time constraints.',
    ],
  },
  {
    title: 'Social Media Stance Analysis | Python',
    date: '2025',
    image: '/Images/Work In Progress.png',
    alt: 'Social Media Stance Analysis',
    githubUrl: 'https://github.com/EthanHarter934',
    description: [
      'Currently collaborating with a team to analyze public opinion on gun control across Twitter posts using ',
      { highlight: 'BERTweet' },
      '. Implementing ',
      { highlight: 'topic modeling' },
      ' with ',
      { highlight: 'BERTweet' },
      ' to group tweets and identify the stances of opposing sides. Aiming to publish a paper presenting insights on the discussion of gun control on Twitter.',
    ],
  },
  {
    title: 'Emotion and Theme Classifiers | Python',
    date: '2025',
    image: '/Images/emotion-theme-classifiers.png',
    alt: 'Emotion and Theme Classifiers',
    githubUrl: 'https://github.com/EthanHarter934/AI-ML-Project-2025',
    description: [
      'Trained two ',
      { highlight: 'BERTweet' },
      ' models to predict main emotion and themes shown in inputted text based on Twitter data from late 2024. Built a web interface that allows users to interact with models. Models used and web app are stored on ',
      { highlight: 'Hugging Face' },
      ' for easy access and deployment.',
    ],
  },
  {
    title: 'Software Engineering Final Project | HTML, CSS, JavaScript',
    date: '2025',
    image: '/Images/Recipedia.png',
    alt: 'Software Engineering Project',
    githubUrl: 'https://github.com/EthanHarter934/CS361-Main-Program',
    description: [
      'Built a recipe management website with ',
      { highlight: 'React' },
      ', using an ',
      { highlight: 'Agile/Scrum' },
      ' framework. Developed and integrated three microservices to support user authentication and storage for recipes and ingredients. Allows users to manage recipes, while incorporating inclusivity heuristics for accessibility and usability.',
    ],
  },
  {
    title: 'Databases Final Project | SQL, HTML, CSS, JavaScript',
    date: '2025',
    image: '/Images/Punk Games.png',
    alt: 'Databases Project',
    githubUrl: 'https://github.com/EthanHarter934/CS340-Team79-Final-Project',
    description: [
      'Built a website using ',
      { highlight: 'Node.js' },
      ' that manages the sales of a fictional physical game store using a ',
      { highlight: 'SQL database' },
      '. Implemented ',
      { highlight: 'CRUD' },
      ' operations for each of the six entities which includes a many-to-many relationship. Iteratively improved the project based on peer feedback from classmates, improving usability and database design.',
    ],
  },
  {
    title: 'Web Development Final Project | HTML, CSS, JavaScript',
    date: '2025',
    image: '/Images/Depiction.png',
    alt: 'Web Development Project',
    githubUrl: 'https://github.com/osu-cs290-f24/final-project-the-dominators',
    description: [
      'Collaborated with a team of three to develop a multiplayer drawing game with ',
      { highlight: 'Node.js' },
      ' inspired by Telestrations. Enabled real-time gameplay with ',
      { highlight: 'Socket.io' },
      ' for lobby creation and passing prompts and drawings. My team\'s project was inducted into the CS290 Hall of Fame for going above and beyond project guidelines.',
    ],
  },
];

export const awards = [
  {
    title: 'First Place Winner - 2026 AI for Good Hackathon',
    date: 'May 2026',
    description:
      'Awarded 1st Place in the Computer Vision Track for developing ProPosture, a real-time, privacy-focused desktop posture monitoring application.',
  },
  {
    title: 'First Place Winner - OSU AI Club Project Competition',
    date: 'December 2025',
    description:
      'Awarded 1st Place at the OSU AI Club Project Competition, based on technical innovation and model performance.',
  },
  {
    title: 'CS290 Hall of Fame',
    date: 'December 2024',
    description:
      'Inducted into the CS290 Hall of Fame for going above and beyond project guidelines on a multiplayer Node.js drawing game.',
  },
  {
    title: 'OSU Honor Roll',
    date: 'September 2023 - Present',
    description:
      'Achieved Honor Roll status every term for maintaining a GPA of 3.5 or higher throughout my time at OSU.',
  },
  {
    title: 'Finley Academic Excellence Scholarship',
    date: 'September 2023 - Present',
    description:
      'I was awarded this scholarship for my academic achievements in my time at OSU. This scholarship represents the rigor of coursework I take to challenge myself and grow as an engineer.',
  },
  {
    title: 'Best Presentation',
    date: 'December 2023',
    description:
      'I received this award in a reverse engineering class, which reflects my passion for visual communication and organization.',
  },
];

export const extracurriculars = [
  { title: 'OSU Artificial Intelligence Club', date: '2025 - Present' },
  { title: "OSU Men's Volleyball Club Officer", date: '2023 - Present' },
  { title: 'Chaos Club Volleyball', date: '2022 - 2023' },
  { title: 'Grant High School Baseball', date: '2019 - 2022' },
];
