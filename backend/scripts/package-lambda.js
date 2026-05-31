import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');
const outDir = join(backendRoot, 'dist-lambda');
const zipPath = join(backendRoot, 'lambda.zip');

async function main() {
  console.log('Cleaning dist-lambda...');
  rmSync(outDir, { recursive: true, force: true });

  // Small delay on Windows to ensure file handles are released
  if (process.platform === 'win32') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  mkdirSync(outDir, { recursive: true });

  console.log('Copying source files...');

  // Use shell commands to avoid Unicode path issues on Windows
  if (process.platform === 'win32') {
    execSync(`xcopy "${join(backendRoot, 'package.json')}" "${outDir}\\" /Y`, { stdio: 'inherit' });
    execSync(`xcopy "${join(backendRoot, 'config.js')}" "${outDir}\\" /Y`, { stdio: 'inherit' });
    execSync(`xcopy "${join(backendRoot, 'lambda')}" "${outDir}\\lambda\\" /S /I /Y`, { stdio: 'inherit' });
    execSync(`xcopy "${join(backendRoot, 'mcp-server')}" "${outDir}\\mcp-server\\" /S /I /Y`, { stdio: 'inherit' });
    execSync(`xcopy "${join(backendRoot, 'utils')}" "${outDir}\\utils\\" /S /I /Y`, { stdio: 'inherit' });
  } else {
    cpSync(join(backendRoot, 'package.json'), join(outDir, 'package.json'));
    cpSync(join(backendRoot, 'config.js'), join(outDir, 'config.js'));
    cpSync(join(backendRoot, 'lambda'), join(outDir, 'lambda'), { recursive: true });
    cpSync(join(backendRoot, 'mcp-server'), join(outDir, 'mcp-server'), { recursive: true });
    cpSync(join(backendRoot, 'utils'), join(outDir, 'utils'), { recursive: true });
  }

  console.log('Installing production dependencies (this may take a minute)...');
  execSync('npm install --omit=dev', { cwd: outDir, stdio: 'inherit' });

  console.log('Creating lambda.zip (this may take 1–2 minutes on Windows)...');

  if (process.platform === 'win32') {
    const psZipPath = zipPath.replace(/'/g, "''");
    const psOutDir = outDir.replace(/'/g, "''");
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${psOutDir}\\*' -DestinationPath '${psZipPath}' -CompressionLevel Fastest -Force"`,
      { stdio: 'inherit' },
    );
  } else {
    if (existsSync(zipPath)) rmSync(zipPath);
    execSync(`cd "${outDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
  }

  console.log(`Lambda package created: ${zipPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
