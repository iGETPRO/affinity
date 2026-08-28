# VectorForge Windows Release Handoff

**Release:** 1.0.0 x64  
**Build type:** Unsigned Windows artifacts generated with Electron Builder and a clean 64-bit Wine prefix  
**Source checkpoint:** `40e5ea60`  
**Validation:** 34 Vitest tests passed; TypeScript validation passed; all six files identified as Windows PE/Nullsoft installer executables.

## Artifact manifest

| Persona | Setup installer | Portable executable | Setup size | Portable size |
|---|---|---|---:|---:|
| VectorForge | `VectorForge-1.0.0-x64-setup.exe` | `VectorForge-1.0.0-x64-portable.exe` | 375,839,230 bytes | 374,902,226 bytes |
| PhotoForge Studio | `PhotoForge-1.0.0-x64-setup.exe` | `PhotoForge-1.0.0-x64-portable.exe` | 375,840,149 bytes | 374,901,955 bytes |
| PublisherForge | `PublisherForge-1.0.0-x64-setup.exe` | `PublisherForge-1.0.0-x64-portable.exe` | 375,855,679 bytes | 374,918,051 bytes |

## SHA-256 manifest

```text
d2e9994f9b80ac4d30b029de8c2397a404576b899fc91cff78d9a986b5e1f58d  VectorForge-1.0.0-x64-setup.exe
989dca71a10d8f8198107cdaead369fb9c560ca5784f592e13e245f7271ae288  VectorForge-1.0.0-x64-portable.exe
6c7afd7c87368b772e64ad4eb500f9ff3e3a29babe1869a37b7e334ec9bb7c3c  PhotoForge-1.0.0-x64-setup.exe
4c94a50e38ed1f8bc41e2da8319bf91a3de8d5b0a9fab7257a625b564f546318  PhotoForge-1.0.0-x64-portable.exe
b53c1de7395a1952eb91e3fa2c86512951e2c1de96915d4582ac681aebb8a4bc  PublisherForge-1.0.0-x64-setup.exe
458b4dc83305e1ec58c7be94542b2d0f09cf85545de3d732a86330310c4401b3  PublisherForge-1.0.0-x64-portable.exe
```

## External signing procedure

Before public distribution, a release owner should scan the files, apply an Authenticode code-signing certificate from the organization’s approved certificate store, and timestamp the signatures using the organization’s approved timestamp authority. Sign both the setup installers and portable executables. After signing, recompute SHA-256 values because signing changes the file bytes, and retain the post-signing manifest with the release record. Do not describe these artifacts as signed until Windows verifies a valid certificate chain and timestamp.

## Windows 10/11 acceptance procedure

On clean, fully updated Windows 10 and Windows 11 x64 machines, first verify the downloaded SHA-256 values against the manifest. Test each setup installer using a standard user account where possible, confirm the installation directory and Start Menu/Desktop shortcuts, launch the installed application, and uninstall it through Windows Settings. Separately launch each portable executable from a user-writable directory and confirm that it starts without installation.

For every persona, test application launch, window resize, file open/save, the primary editing workflow, export, and clean exit. For PublisherForge, additionally test multi-page navigation, linked text flow, paragraph styles, language selection, bleed and crop-mark controls, and the PDF/X preflight/report workflow. Record Windows version, build number, architecture, machine class, artifact hash, pass/fail result, and any screenshots or crash logs. Keep the acceptance record with the release bundle.

> **Release boundary:** Commercial PDF/X conformance review and certificate-backed Windows signing remain external prerequisites. The sandbox cannot provide a commercial preflight engine, organization signing certificate, or physical Windows 10/11 test machines.
