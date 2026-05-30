import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');
const outDir = join(backendRoot, 'dist-lambda');
const zipPath = join(backendRoot, 'lambda.zip');

console.log('Cleaning dist-lambda...');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

console.log('Copying source files...');
cpSync(join(backendRoot, 'package.json'), join(outDir, 'package.json'));
cpSync(join(backendRoot, 'lambda'), join(outDir, 'lambda'), { recursive: true });
cpSync(join(backendRoot, 'mcp-server'), join(outDir, 'mcp-server'), { recursive: true });

console.log('Installing production dependencies (this may take a minute)...');
execSync('npm install --omit=dev', { cwd: outDir, stdio: 'inherit' });

console.log('Creating lambda.zip (this may take 1–2 minutes on Windows)...');
if (existsSync(zipPath)) rmSync(zipPath);

if (process.platform === 'win32') {
  const psZipPath = zipPath.replace(/'/g, "''");
  const psOutDir = outDir.replace(/'/g, "''");
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${psOutDir}\\*' -DestinationPath '${psZipPath}' -CompressionLevel Fastest"`,
    { stdio: 'inherit' },
  );
} else {
  execSync(`cd "${outDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
}

console.log(`Lambda package created: ${zipPath}`);
