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
if (manifest.description.toLowerCase().includes('obsidian')) throw new Error('manifest.description must not contain the word \"Obsidian\".');
if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error('manifest.version must use x.y.z format.');
if (pkg.version !== manifest.version) throw new Error('package.json and manifest.json versions do not match.');
if (versions[manifest.version] !== manifest.minAppVersion) throw new Error('versions.json does not map the current plugin version to minAppVersion.');
if (manifest.author !== 'Arebrodo') throw new Error('manifest.author must be Arebrodo for this repository.');
if (pkg.author !== 'Arebrodo') throw new Error('package.json author must be Arebrodo for this repository.');
if (manifest.authorUrl !== 'https://github.com/Arebrodo') throw new Error('manifest.authorUrl is not configured for Arebrodo.');
if (pkg.repository?.url !== 'git+https://github.com/Arebrodo/folder-cover-wall.git') throw new Error('package.json repository URL is not configured for Arebrodo/folder-cover-wall.');

const tag = process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : '';
if (tag && tag !== manifest.version) throw new Error(`Git tag ${tag} does not match manifest version ${manifest.version}.`);

console.log(`Release preflight passed for Folder Cover Wall ${manifest.version}.`);
