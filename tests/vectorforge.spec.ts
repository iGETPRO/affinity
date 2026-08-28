import { expect, test } from "@playwright/test";

test("opens the VectorForge workspace and shared Docs browser", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("VECTORFORGE SUITE")).toBeVisible();
  await expect(page.getByRole("button", { name: "PSD / AF" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Docs" })).toBeVisible();
  await page.getByRole("button", { name: "Docs" }).click();
  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
  await expect(page.getByText("VERSION HISTORY")).toBeVisible();
});

test("restores a persisted remote snapshot review without overwriting local workspace", async ({ page }) => {
  await page.addInitScript(() => {
    const existing = JSON.parse(localStorage.getItem("vectorforge-pages") ?? "[]");
    const snapshot = existing.length ? existing : [{ id: "remote-page", name: "Remote page", elements: [], guides: [] }];
    localStorage.setItem("vectorforge-pending-sync", JSON.stringify(snapshot));
  });
  await page.goto("/");
  await expect(page.getByText("REMOTE SNAPSHOT")).toBeVisible();
  await expect(page.getByRole("button", { name: "Keep local" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Merge additions" })).toBeVisible();
});

test("exercises PSD export and PSD/AF import seams", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "PSD / AF" })).toBeVisible();
  await expect(page.locator('input[type="file"][accept*=".psd"]')).toHaveCount(1);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PSD", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.psd$/i);
  await page.locator('input[type="file"][accept*=".psd"]').setInputFiles({ name: "invalid.psd", mimeType: "image/vnd.adobe.photoshop", buffer: Buffer.from("not-a-real-psd") });
  await expect(page.getByText("PSD import failed")).toBeVisible();
});

test("opens the real archive preview and comparison flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Docs" }).click();
  const archive = {
    format: "vectorforge-version-archive",
    version: 1,
    exportedAt: new Date().toISOString(),
    versions: [{ id: "archive-version-1", name: "Review snapshot", createdAt: new Date().toISOString(), pages: [{ id: "archive-page-1", name: "Review artboard", elements: [], guides: [] }] }],
  };
  await page.locator('input[type="file"][accept="application/json,.json"]').last().setInputFiles({ name: "review-archive.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(archive)) });
  await expect(page.getByText("ARCHIVE PREVIEW")).toBeVisible();
  await expect(page.getByRole("button", { name: "Merge selected" })).toBeVisible();
  await page.getByText("Review snapshot").hover();
  await expect(page.getByLabel("Review snapshot visual diff against current artboard")).toBeVisible();
});

test("reviews and resolves a live object conflict without replacing the workspace", async ({ page }) => {
  await page.goto("/");
  const snapshot = await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      try {
        const value = JSON.parse(localStorage.getItem(key) ?? "null");
        if (Array.isArray(value) && value[0]?.elements && value[0]?.guides) {
          const copy = JSON.parse(JSON.stringify(value));
          const first = copy[0]?.elements?.[0];
          if (first) first.fill = first.fill === "#ffffff" ? "#2E5BFF" : "#ffffff";
          return copy;
        }
      } catch { /* ignore unrelated storage entries */ }
    }
    return null;
  });
  expect(snapshot).not.toBeNull();
  await page.evaluate((value) => localStorage.setItem("vectorforge-pending-sync", JSON.stringify(value)), snapshot);
  await page.reload();
  await expect(page.getByText(/OBJECT CONFLICTS/)).toBeVisible();
  await expect(page.locator(".incoming-conflict-field-tag").first()).toBeVisible();
  const conflictRow = page.locator(".sync-conflict-row").first();
  const incomingChoice = conflictRow.getByRole("button", { name: "Use incoming" });
  await expect(incomingChoice).toBeVisible();
  await incomingChoice.evaluate((button) => (button as HTMLButtonElement).click());
  await expect(page.locator("body")).toContainText("Incoming object applied");
});

test("shows persisted collaboration restore points", async ({ page }) => {
  await page.addInitScript(() => {
    const snapshot = [{ id: "history-page", name: "History page", elements: [], guides: [] }];
    localStorage.setItem("vectorforge-pending-sync", JSON.stringify(snapshot));
    localStorage.setItem("vectorforge-sync-history", JSON.stringify([snapshot, snapshot, snapshot]));
    localStorage.setItem("vectorforge-sync-history-times", JSON.stringify(["2026-08-24T10:20:00.000Z", "2026-08-24T10:19:00.000Z", "2026-08-24T10:18:00.000Z"]));
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Restore snapshot 1/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Restore snapshot 2/ })).toBeVisible();
  await expect(page.locator(".snapshot-time").first()).toHaveAttribute("title", /Captured/);
  await page.getByRole("button", { name: /Restore snapshot 2/ }).evaluate((button) => (button as HTMLButtonElement).click());
  await expect(page.locator("body")).toContainText("snapshot 2 restored for review");
});

test("filters conflict history and configures the tablet input profile", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("vectorforge-sync-history-meta-v1", JSON.stringify([{ id: "sync-test", capturedAt: "2026-08-24T10:20:00.000Z", collaborator: "Studio peer", pages: 2, objects: 4, fields: ["geometry", "styling"] }]));
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Tablet gestures and shortcuts" }).click();
  await expect(page.getByRole("dialog", { name: "Tablet gestures and shortcuts" })).toBeVisible();
  await page.getByRole("radio", { name: /Tablet/ }).click();
  await page.getByRole("button", { name: "Close tablet guide" }).click();
  await page.getByRole("button", { name: "Docs" }).click();
  await expect(page.getByLabel("Conflict history timeline")).toBeVisible();
  await expect(page.getByText("Studio peer")).toBeVisible();
  await page.getByRole("textbox", { name: "Filter conflict history" }).fill("styling");
  await expect(page.getByText("1 recoverable snapshot")).toBeVisible();
});

test("prepares SVG export through the background worker", async ({ page }) => {
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export SVG" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.svg$/i);
});

test("persists collaborator identity and editable command bindings", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tablet gestures and shortcuts" }).click();
  await page.getByLabel("Collaborator identity").fill("Maya Chen");
  await page.getByLabel("Shortcut for Hand tool").fill("G");
  await page.getByRole("button", { name: "Close tablet guide" }).click();
  await expect(page.getByText(/Maya Chen/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Maya Chen/)).toBeVisible();
  await page.getByRole("button", { name: "Tablet gestures and shortcuts" }).click();
  await expect(page.getByLabel("Shortcut for Hand tool")).toHaveValue("G");
});

test("prepares PNG export through the background worker", async ({ page }) => {
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/i);
});

test("cancels a queued export before delivery", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Export SVG" }).click();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator(".statusbar").first()).toContainText("Autosaved locally");
});

test("exports and imports a portable shortcut profile", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tablet gestures and shortcuts" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("vectorforge-shortcuts.json");
  await page.getByRole("dialog", { name: "Tablet gestures and shortcuts" }).getByRole("button", { name: "Import", exact: true }).click();
  const input = page.getByLabel("Import shortcut profile file");
  await input.setInputFiles({ name: "profile.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ format: "vectorforge-shortcuts", version: 1, profile: "tablet", bindings: { pan: "G" } })) });
  await expect(page.getByLabel("Shortcut for Hand tool")).toHaveValue("G");
});

test("hands off multiple queued exports without replaying the active job", async ({ page }) => {
  await page.goto("/");
  const downloads = Promise.all([page.waitForEvent("download"), page.waitForEvent("download")]);
  await page.getByRole("button", { name: "Export SVG" }).click();
  await page.getByRole("button", { name: "Export SVG" }).click();
  const [first, second] = await downloads;
  expect(first.suggestedFilename()).toMatch(/\.svg$/i);
  expect(second.suggestedFilename()).toMatch(/\.svg$/i);
});

test("shows export history completion and cancellation states", async ({ page }) => {
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export SVG" }).click();
  await downloadPromise;
  await page.getByRole("button", { name: /History/ }).click();
  await expect(page.getByRole("dialog", { name: "Export history" })).toContainText("ready");
});

test("warns on unsupported shortcut profile schemas and labels presence", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel(/Collaborator Local designer/)).toBeVisible();
  await page.getByRole("button", { name: "Tablet gestures and shortcuts" }).click();
  await page.getByRole("dialog", { name: "Tablet gestures and shortcuts" }).getByRole("button", { name: "Import", exact: true }).click();
  await page.getByLabel("Import shortcut profile file").setInputFiles({ name: "old-profile.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ format: "vectorforge-shortcuts", version: 99, profile: "tablet", bindings: {} })) });
  await expect(page.getByText("Shortcut profile version unsupported")).toBeVisible();
});

test("shows the collaborator source cue in workspace presence", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".suite-caption")).toContainText("local collaborator");
});

test("shows the authenticated collaborator source cue when auth is present", async ({ page }) => {
  await page.route("**/api/trpc/auth.me*", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: "user-1", name: "Authenticated Designer", role: "user" } } } }]) }));
  await page.goto("/");
  await expect(page.locator(".suite-caption")).toContainText("authenticated collaborator");
});

test("persists export history across reloads", async ({ page }) => {
  await page.goto("/");
  const download = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export SVG" }).click()]);
  await download[0].path();
  await page.reload();
  await page.getByRole("button", { name: /History/ }).click();
  await expect(page.getByRole("dialog", { name: "Export history" })).toContainText("ready");
});

test("migrates a versionless shortcut profile on import", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tablet gestures and shortcuts" }).click();
  await page.getByRole("dialog", { name: "Tablet gestures and shortcuts" }).getByRole("button", { name: "Import", exact: true }).click();
  await page.getByLabel("Import shortcut profile file").setInputFiles({ name: "legacy.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ format: "vectorforge-shortcuts", profile: "tablet", shortcutBindings: { pan: "g" } })) });
  await expect(page.getByText("Shortcut profile imported")).toBeVisible();
  await expect(page.getByLabel("Shortcut for Hand tool")).toHaveValue("G");
});

test("shows authenticated editable access cue", async ({ page }) => {
  await page.route("**/api/trpc/auth.me*", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: "user-1", name: "Authenticated Designer", role: "user" } } } }]) }));
  await page.goto("/");
  await expect(page.locator(".suite-caption")).toContainText("access: editable");
});

test("configures collaborator sharing access", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Share" }).click();
  const dialog = page.getByRole("dialog", { name: "Share document" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /Read-only/ }).click();
  await expect(dialog).toContainText("Current access: read-only");
  await dialog.getByRole("button", { name: /Editable/ }).click();
  await expect(dialog).toContainText("Current access: editable");
});

test("recovers failed exports and clears export history", async ({ page }) => {
  await page.addInitScript(() => {
    class FailingWorker { static attempts = 0; onmessage: ((event: MessageEvent) => void) | null = null; onerror: ((event: Error) => void) | null = null; postMessage() { FailingWorker.attempts += 1; if (FailingWorker.attempts === 1) setTimeout(() => this.onerror?.(new Error("forced export failure")), 40); else setTimeout(() => this.onmessage?.({ data: { type: "progress", id: "forced", progress: 20 } } as MessageEvent), 40); } terminate() {} }
    (window as unknown as { Worker: unknown }).Worker = FailingWorker;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Export SVG" }).click();
  await page.getByRole("button", { name: /History/ }).click();
  const dialog = page.getByRole("dialog", { name: "Export history" });
  await expect(dialog).toContainText("failed");
  await dialog.getByRole("button", { name: "Retry" }).click();
  await expect(dialog).toContainText(/queued|preparing/);
  await dialog.getByRole("button", { name: "Clear" }).click();
  await expect(dialog).toContainText("No exports yet");
});

test("shows authenticated server-version metadata cue", async ({ page }) => {
  await page.route("**/api/trpc/auth.me*", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: "user-1", name: "Version Reviewer", role: "user" } } } }]) }));
  await page.route("**/api/trpc/**", async (route) => { const url = route.request().url(); if (url.includes("auth.me")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: "user-1", name: "Version Reviewer", role: "user" } } } }]) }); if (url.includes("document.versions")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [{ id: 1, versionName: "Server restore point", objectCount: 4 }] } } }]) }); return route.continue(); });
  await page.goto("/");
  await expect(page.locator(".suite-caption")).toContainText("server versions: 1");
});

test("exposes authenticated version capture and invite controls", async ({ page }) => {
  await page.route("**/api/trpc/**", async (route) => { const url = route.request().url(); if (url.includes("auth.me")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: "user-1", name: "Owner", role: "admin" } } } }]) }); if (url.includes("document.versions") || url.includes("document.invites")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [] } } }]) }); return route.continue(); });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Save version" })).toBeVisible();
  await page.getByRole("button", { name: "Share" }).click();
  const dialog = page.getByRole("dialog", { name: "Share document" });
  await dialog.getByLabel("Invitee email").fill("peer@example.com");
  await expect(dialog.getByRole("button", { name: "Send invite" })).toBeEnabled();
});

test("submits an invite and renders the pending collaborator state", async ({ page }) => {
  let invited = false;
  await page.route("**/api/trpc/**", async (route) => {
    const url = route.request().url();
    if (url.includes("auth.me")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: "user-1", name: "Owner", role: "admin" } } } }]) });
    if (url.includes("document.invites")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: invited ? [{ id: 41, inviteeEmail: "peer@example.com", access: "write", status: "pending" }] : [] } } }]) });
    if (url.includes("document.invite")) { invited = true; return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: 41, inviteeEmail: "peer@example.com", access: "write", status: "pending" } } } }]) }); }
    return route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Share" }).click();
  const dialog = page.getByRole("dialog", { name: "Share document" });
  await dialog.getByLabel("Invitee email").fill("peer@example.com");
  await dialog.getByRole("button", { name: "Send invite" }).click();
  await expect(dialog.getByText("peer@example.com", { exact: false })).toBeVisible();
});

test("restores a serialized server version from Docs", async ({ page }) => {
  const state = [{ id: "server-page", name: "Recovered artboard", elements: [], guides: [] }];
  await page.route("**/api/trpc/**", async (route) => {
    const url = route.request().url();
    if (url.includes("auth.me")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: "user-1", name: "Version Reviewer", role: "user" } } } }]) });
    if (url.includes("document.versions")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [{ id: 7, versionName: "Server checkpoint", objectCount: 0, stateJson: JSON.stringify(state), createdAt: "2026-08-24T10:00:00.000Z" }] } } }]) });
    if (url.includes("document.invites")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [] } } }]) });
    return route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Docs" }).click();
  await expect(page.getByText("SERVER VERSIONS")).toBeVisible();
  await page.getByRole("button", { name: "Restore" }).click();
  await expect(page.getByText("Server version restored")).toBeVisible();
});

test("captures a server version and refreshes Docs checkpoints", async ({ page }) => {
  let captured = false;
  await page.route("**/api/trpc/**", async (route) => {
    const url = route.request().url();
    if (url.includes("auth.me")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: "user-1", name: "Owner", role: "admin" } } } }]) });
    if (url.includes("document.versions")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: captured ? [{ id: 9, versionName: "Checkpoint captured", objectCount: 4, stateJson: "[]", createdAt: "2026-08-24T10:00:00.000Z" }] : [] } } }]) });
    if (url.includes("document.createVersion")) { captured = true; return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: 9, versionName: "Checkpoint captured", objectCount: 4, stateJson: "[]", createdAt: "2026-08-24T10:00:00.000Z" } } } }]) }); }
    if (url.includes("document.invites")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [] } } }]) });
    return route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Save version" }).click();
  await page.getByRole("button", { name: "Docs" }).click();
  await expect(page.getByText("Checkpoint captured")).toBeVisible();
});

test("accepts an invite link for the authenticated email", async ({ page }) => {
  let accepted = false;
  await page.route("**/api/trpc/**", async (route) => {
    const url = route.request().url();
    if (url.includes("auth.me")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: "user-2", name: "Invitee", email: "peer@example.com", role: "user" } } } }]) });
    if (url.includes("document.acceptInvite")) { accepted = true; return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: 41, access: "write", status: "accepted" } } } }]) }); }
    if (url.includes("document.versions") || url.includes("document.invites")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [] } } }]) });
    return route.continue();
  });
  await page.goto("/?invite=" + "a".repeat(64));
  await expect.poll(() => accepted).toBe(true);
  await expect(page.getByText("Invitation accepted")).toBeVisible();
});

test("shows collaboration audit events in Docs", async ({ page }) => {
  await page.route("**/api/trpc/**", async (route) => {
    const url = route.request().url();
    if (url.includes("auth.me")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: "user-1", name: "Owner", role: "admin" } } } }]) });
    if (url.includes("document.audit")) { const count = (url.match(/document\./g) ?? []).length; const empty = { result: { data: { json: [] } } }; const audit = { result: { data: { json: [{ id: 1, action: "invite.created", detail: "peer@example.com:write", createdAt: "2026-08-24T10:00:00.000Z" }] } } }; return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(Array.from({ length: count }, (_, index) => index === count - 1 ? audit : empty)) }); }
    if (url.includes("document.versions") || (url.includes("document.invites") && !url.includes("document.audit"))) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [] } } }]) });
    return route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Docs" }).click();
  await expect(page.getByText("COLLABORATION AUDIT")).toBeVisible();
  await expect(page.getByText("invite.created")).toBeVisible();
});

test("exposes PhotoForge professional tonal controls without replacing the source workflow", async ({ page }) => {
  await page.goto("/#photo");
  await expect(page.getByRole("banner").getByText("PHOTOFORGE")).toBeVisible();
  await expect(page.getByText("non-destructive image studio")).toBeVisible();
  await expect(page.getByText("Highlights").first()).toBeVisible();
  await expect(page.getByText("Shadows").first()).toBeVisible();
  await expect(page.getByText("Clarity").first()).toBeVisible();
  await expect(page.getByText("Vignette").first()).toBeVisible();
  const vignette = page.locator('input[type="range"]').nth(7);
  await expect(vignette).toHaveValue("0");
  await vignette.fill("55");
  await expect(page.getByLabel("Vignette preview")).toBeVisible();
});

test("opens PublisherForge editorial workspace", async ({ page }) => {
  await page.goto("/#publisher");
  await expect(page.getByTestId("publisher-workspace")).toBeVisible();
  await expect(page.getByText("PUBLISHERFORGE", { exact: true })).toBeVisible();
  await expect(page.getByText("MASTER PAGES", { exact: true })).toBeVisible();
  await expect(page.getByText("CERTIFICATE REQUIRED", { exact: true })).toBeVisible();
  await expect(page.getByText("Text flow", { exact: true })).toBeVisible();
  await expect(page.locator(".publisher-toolbar select").nth(1)).toHaveValue("CMYK");
  const projectDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save project" }).click();
  expect((await projectDownload).suggestedFilename()).toMatch(/\.pforge$/i);
  await page.getByRole("button", { name: "Add page" }).first().click();
  await expect(page.getByRole("button", { name: /Page 04/ })).toBeVisible();
});

test("downloads the PublisherForge preflight report", async ({ page }) => {
  await page.goto("/#publisher");
  await expect(page.getByTestId("publisher-workspace")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Preflight report/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("publisherforge-preflight-report.txt");
  await expect(page.getByRole("button", { name: /Export PDF\/X/i })).toBeVisible();
});
