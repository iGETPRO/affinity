# Windows signing readiness

The VectorForge, PhotoForge Studio, and PublisherForge builder configurations are prepared for Windows code signing without storing certificates in source control.

## Required Windows build inputs

Set the signing values only in the Windows build environment or CI secret store:

| Variable | Purpose |
|---|---|
| `CSC_LINK` | Secure URL or local path to the code-signing certificate bundle. |
| `CSC_KEY_PASSWORD` | Password for the certificate bundle. |
| `WIN_CSC_LINK` | Optional Windows-specific certificate override when using separate credentials. |
| `WIN_CSC_KEY_PASSWORD` | Optional Windows-specific certificate password. |

The certificate should be issued for the publishing organization and include the private key. Never commit the certificate, password, or generated installer artifacts to this repository. The Linux sandbox can build and verify portable PE files, but NSIS generation and trusted signing require Windows or a Windows-compatible signing environment.

## Release checks

Before publishing an installer, verify the publisher name, application ID, version, upgrade behavior, desktop and Start-menu shortcuts, uninstall entry, and Authenticode signature on a clean Windows 10 and Windows 11 machine.
