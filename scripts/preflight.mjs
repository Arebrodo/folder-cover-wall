import { existsSync, readFileSync } from 'fs';

const required = ['README.md', 'LICENSE', 'manifest.json', 'main.js', 'styles.css', 'versions.json'];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing required release file: ${file}`);
}

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const versions = JSON.parse(readFileSync('versions.json', 'utf8'));

if (!/^[a-z0-9-]+$/.test(manifest.id)) throw new Error('manifest.id must contain only lowercase letters, digits, and hyphens.');
if (manifest.id.includes('obsidian')) throw new Error('manifest.id must not contain "obsidian".');
if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error('manifest.version must use x.y.z format.');
if (pkg.version !== manifest.version) throw new Error('package.json and manifest.json versions do not match.');
if (versions[manifest.version] !== manifest.minAppVersion) throw new Error('versions.json does not map the current plugin version to minAppVersion.');
if (!manifest.author || /YOUR_NAME/i.test(manifest.author)) throw new Error('Replace YOUR_NAME in manifest.json before publishing.');
if (!pkg.author || /YOUR_NAME/i.test(String(pkg.author))) throw new Error('Replace YOUR_NAME in package.json before publishing.');

const tag = process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : '';
if (tag && tag !== manifest.version) throw new Error(`Git tag ${tag} does not match manifest version ${manifest.version}.`);

console.log(`Release preflight passed for Folder Cover Wall ${manifest.version}.`);
