# Uploading VectorForge to `iGETPRO/affinity`

The repository is currently empty. The safest route is to upload the **source tree**, not the generated Windows executables. GitHub repositories have file-size limits, while each VectorForge executable is approximately 358–359 MB.

## Recommended upload route

Use GitHub Desktop or Git locally on a computer where you are signed in to an account with write access:

```powershell
git clone https://github.com/iGETPRO/affinity.git
cd affinity
# Copy the contents of the VectorForge project into this folder.
# Do not copy node_modules, dist, release-vectorforge, release-photoforge, or publisher-release.
git add .
git commit -m "Add VectorForge design suite and Windows release workflow"
git branch -M main
git push -u origin main
```

If the repository is empty and Git asks for authentication, use GitHub Desktop or a GitHub personal access token through Git Credential Manager. Do not put a token in the remote URL or commit certificate files.

After pushing, open the repository’s **Actions** tab and run **Windows release** with **Run workflow**. The workflow installs dependencies, runs Vitest and TypeScript checks, builds the three Windows personas, generates a SHA-256 manifest, and uploads the six artifacts as a workflow artifact. It is intentionally unsigned until a certificate-specific signing step is configured on a controlled Windows release process.

## Signing boundary

Do not commit a `.pfx` file, private key, certificate password, or signing token. Use `desktop/sign-windows-release.ps1` on a controlled Windows machine after installing the certificate into the Windows certificate store. Recompute and distribute the post-signing SHA-256 manifest because signing changes each executable.
