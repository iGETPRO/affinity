# VectorForge Windows 10/11 acceptance checklist

## Portable launch

Verify that VectorForge, PhotoForge Studio, and PublisherForge launch on supported Windows 10 and Windows 11 x64 machines without a development runtime. Confirm that each persona opens its own workspace and that external links open in the system browser.

## File workflows

Verify native project open/save, SVG/PSD interchange where supported, PublisherForge `.pforge` save/open, export dialogs, and recovery after closing and relaunching the application.

## Production workflows

In PublisherForge, verify multi-page navigation, master-page selection, linked text flow, overflow feedback, printer presets, CMYK/RGB selection, ICC profile compatibility warnings, PDF/X profile selection, crop marks, slug settings, and print-to-PDF behavior.

## Signing

The builder configurations are signing-ready but do not contain certificate material. For a trusted installer, provide a Windows code-signing certificate through the release environment, then enable `signAndEditExecutable` and configure the approved signing provider. Never commit certificate files, passwords, or tokens to the repository.

## PDF/X production sign-off

Before delivery, confirm the selected PDF/X profile is present, the ICC profile matches the selected RGB or CMYK output mode, bleed is at least 3 mm for crop-mark output, and slug settings are intentional. The application preflight panel reports these conditions as explicit OK or Review states. Formal conformance still requires checking the generated PDF with a production preflight tool.

## Acceptance record

The machine-readable `windows-acceptance.json` file records which checks are automated, which require physical Windows testing, and which remain blocked until certificate signing is configured.

## Structured release handoff

The machine-readable release handoff is stored in `desktop/release-handoff.json`. Its `pdfx.reviewStatus` remains `pending-external-preflight` until a commercial PDF preflight tool records the reviewer, tool, timestamp, and notes. Its `windowsSigning.status` remains `certificate-required` until the portable artifacts and NSIS installer are signed and verified with Authenticode on Windows 10 and Windows 11.

These statuses are intentionally not marked as passed inside the repository because external PDF conformance testing and certificate-backed signing cannot be truthfully completed in the Linux sandbox.
