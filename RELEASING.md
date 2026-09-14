# Releasing Folder Cover Wall

## First-time setup

Before the first public release:

1. Create the public repository `https://github.com/Arebrodo/folder-cover-wall`.
2. Push this project to that repository.
3. Run `npm install` and `npm run build` once locally if possible.
4. Run `npm run check-release`.
5. Confirm the author metadata is still `Arebrodo` and the repository URL has not changed.

## Create a release manually

1. Make sure `manifest.json`, `package.json`, and `versions.json` all contain the intended version.
2. Run `npm run build`.
3. Commit and push the changes.
4. Create a Git tag whose name is exactly the version number, for example:

```bash
git tag 0.5.0
git push origin 0.5.0
```

The included GitHub Actions release workflow will build the plugin, verify the tag, and create a GitHub Release containing:

- `main.js`
- `manifest.json`
- `styles.css`

Do not prefix the release tag with `v`.

## Bump the version

After editing `minAppVersion` if necessary, use one of:

```bash
npm version patch
npm version minor
npm version major
```

The `version` script updates `manifest.json` and `versions.json` to match `package.json`.

## Submit to the Obsidian Community directory

After you have a public GitHub repository and a matching GitHub Release:

1. Sign in to the Obsidian Community directory.
2. Link your GitHub account.
3. Add the plugin using `https://github.com/Arebrodo/folder-cover-wall`.
4. Address any automated review feedback.
5. If changes require a new release, increment the version and publish a new matching GitHub Release.
