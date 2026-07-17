// Unit tests for tool handler logic (without AWS)
// These test the filtering and data transformation logic

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

// Mock project data
const mockProjects = [
  {
    SK: 'PROJECT#proposture',
    featured: true,
    data: {
      title: 'ProPosture',
      techStack: ['Python', 'React', 'MediaPipe'],
    },
  },
  {
    SK: 'PROJECT#mylesion',
    featured: true,
    data: {
      title: 'MyLesion',
      techStack: ['Python', 'FastAPI', 'EfficientNetB0'],
    },
  },
  {
    SK: 'PROJECT#recipedia',
    featured: false,
    data: {
      title: 'Recipedia',
      techStack: ['React', 'Node.js'],
    },
  },
];

// Test: Parse projects correctly
test('Parse projects correctly', () => {
  const projects = mockProjects.map((item) => ({
    id: item.SK.replace('PROJECT#', ''),
    ...item.data,
    featured: item.featured ?? item.data?.featured ?? false,
  }));

  if (projects.length !== 3) throw new Error('Expected 3 projects');
  if (projects[0].id !== 'proposture') throw new Error('ID not parsed correctly');
  if (!projects[0].featured) throw new Error('Featured flag not set');
});

// Test: Filter projects by featured
test('Filter projects by featured=true', () => {
  let projects = mockProjects.map((item) => ({
    id: item.SK.replace('PROJECT#', ''),
    ...item.data,
    featured: item.featured ?? item.data?.featured ?? false,
  }));

  projects = projects.filter((p) => p.featured);

  if (projects.length !== 2) throw new Error(`Expected 2 featured, got ${projects.length}`);
  projects.forEach((p) => {
    if (!p.featured) throw new Error('Found non-featured project');
  });
});

// Test: Filter projects by tech stack
test('Filter projects by tech stack', () => {
  let projects = mockProjects.map((item) => ({
    id: item.SK.replace('PROJECT#', ''),
    ...item.data,
    featured: item.featured ?? item.data?.featured ?? false,
  }));

  const needle = 'Python'.toLowerCase();
  projects = projects.filter((project) =>
    (project.techStack || []).some((tech) => tech.toLowerCase().includes(needle)),
  );

  if (projects.length !== 2) throw new Error(`Expected 2 Python projects, got ${projects.length}`);
  projects.forEach((p) => {
    const hasPython = p.techStack.some((t) => t.toLowerCase().includes('python'));
    if (!hasPython) throw new Error(`${p.title} doesnt have Python`);
  });
});

// Test: Case-insensitive tech stack filter
test('Tech stack filter is case-insensitive', () => {
  let projects = mockProjects.map((item) => ({
    id: item.SK.replace('PROJECT#', ''),
    ...item.data,
    featured: item.featured ?? item.data?.featured ?? false,
  }));

  const needle = 'REACT'.toLowerCase(); // Test uppercase search
  projects = projects.filter((project) =>
    (project.techStack || []).some((tech) => tech.toLowerCase().includes(needle)),
  );

  if (projects.length !== 2) throw new Error('Case-insensitive filter failed');
});

// Mock skill data
const mockSkills = [
  { SK: 'SKILL#python', data: { name: 'Python', category: 'language' } },
  { SK: 'SKILL#react', data: { name: 'React', category: 'framework' } },
  { SK: 'SKILL#github', data: { name: 'GitHub', category: 'tool' } },
  { SK: 'SKILL#mcp', data: { name: 'MCP (Model Context Protocol)', category: 'ai' } },
  { SK: 'SKILL#bertweet', data: { name: 'BERTweet', category: 'ai' } },
];

// Test: Parse skills correctly
test('Parse skills correctly', () => {
  const skills = mockSkills.map((item) => ({
    id: item.SK.replace('SKILL#', ''),
    ...item.data,
  }));

  if (skills.length !== 5) throw new Error('Expected 5 skills');
  if (skills[0].category !== 'language') throw new Error('Category not preserved');
});

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

// Test: Filter skills by category
test('Filter skills by category', () => {
  let skills = mockSkills.map((item) => ({
    id: item.SK.replace('SKILL#', ''),
    ...item.data,
  }));

  skills = skills.filter((s) => s.category === 'language');

  if (skills.length !== 1) throw new Error(`Expected 1 language skill, got ${skills.length}`);
  if (skills[0].name !== 'Python') throw new Error('Wrong skill filtered');
});

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n${passed}/${tests.length} tests passed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
