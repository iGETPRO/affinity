# VectorForge external release handoff

This handoff is for the final checks that require a commercial print tool or a physical Windows machine. The application and automated suite are already validated; the fields below intentionally remain open until an external reviewer completes them.

## PDF/X verification

Export a PublisherForge preflight PDF and a representative publication PDF for each supported target profile. Open each file in an approved production preflight tool and confirm the selected PDF/X profile, output-intent ICC profile, CMYK/RGB compatibility, minimum 3 mm bleed, crop-mark and slug behavior, font handling, page count, and trim size.

| Field | Value |
|---|---|
| Reviewer | |
| Tool and version | |
| Profile tested | |
| Result: pass/review | |
| Review date UTC | |
| Notes | |

## Windows 10/11 verification

On clean Windows 10 and Windows 11 x64 machines, launch each portable executable without developer dependencies. Verify that VectorForge, PhotoForge Studio, and PublisherForge open their intended personas, external links use the system browser, native project save/open works, supported imports and exports work, and the application closes and relaunches without losing the local document state.

| Persona | Windows 10 result | Windows 11 result | Reviewer | Date UTC |
|---|---|---|---|---|
| VectorForge |  |  |  |  |
| PhotoForge Studio |  |  |  |  |
| PublisherForge |  |  |  |  |

## Installer signing handoff

To create a trusted installer, run the builder on Windows or a Windows-compatible CI runner with `CSC_LINK` and `CSC_KEY_PASSWORD` supplied through its secure secret store. Verify the Authenticode signature, publisher identity, timestamp, install/upgrade/uninstall behavior, and shortcut creation. Do not place certificate files, passwords, or generated installers in the source repository.

The machine-readable source of truth for these states is `desktop/release-handoff.json`.
