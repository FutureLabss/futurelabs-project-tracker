const process = require("node:process");
const console = require("node:console");
// Run against a local demo server. Set PLAYWRIGHT_MODULE to a cached playwright package when needed.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  const dialog = (name) => page.getByRole("dialog", { name, exact: true });
  const choose = async (scope, label, option) => {
    await scope.getByLabel(label).click();
    await page.getByRole("option", { name: option, exact: true }).click();
  };
  const confirm = async (name) => {
    await dialog(name).getByRole("button", { name, exact: true }).click();
    await dialog(name).waitFor({ state: "hidden" });
  };
  const login = async () => {
    await page.getByRole("button", { name: "Fill admin", exact: true }).click();
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page
      .getByRole("heading", { name: "Portfolio operations", exact: true })
      .waitFor();
  };
  fs.mkdirSync("test-results", { recursive: true });
  try {
    await page.goto(process.env.ADMIN_TEST_URL || "http://127.0.0.1:5178");
    await login();
    await page
      .getByRole("button", { name: "New project", exact: true })
      .click();
    await dialog("Create project")
      .getByLabel("Project name")
      .fill("Browser delivery project");
    await dialog("Create project")
      .getByLabel("Goal and expected outcome")
      .fill("Verify all admin workflow steps");
    await dialog("Create project").getByLabel("Start date").fill("2026-09-20");
    await dialog("Create project").getByLabel("Target date").fill("2026-09-10");
    await dialog("Create project")
      .getByRole("button", { name: "Create project", exact: true })
      .click();
    await page
      .getByText("Target date must be on or after the start date.", {
        exact: true,
      })
      .waitFor();
    await dialog("Create project").getByLabel("Start date").fill("2026-09-01");
    await dialog("Create project").getByLabel("Target date").fill("2026-09-30");
    await confirm("Create project");
    await page
      .getByRole("button", { name: "Browser delivery project", exact: true })
      .click();
    await dialog("Browser delivery project")
      .getByRole("button", { name: "Assign lead", exact: true })
      .click();
    await choose(
      dialog("Assign project lead"),
      "Project lead",
      "David Kim (manager)",
    );
    await confirm("Assign project lead");
    await dialog("Browser delivery project")
      .getByRole("button", { name: "Grant access", exact: true })
      .click();
    await choose(
      dialog("Grant project access"),
      "Team member",
      "Alex Chen (member)",
    );
    await confirm("Grant project access");
    await dialog("Browser delivery project")
      .getByRole("button", { name: "Create task", exact: true })
      .click();
    await dialog("Create task")
      .getByLabel("Task title")
      .fill("Browser verified task");
    await dialog("Create task")
      .getByLabel("Description and acceptance criteria")
      .fill("Working admin lifecycle");
    await choose(
      dialog("Create task"),
      "Assignee (optional)",
      "Alex Chen (member)",
    );
    await confirm("Create task");
    await dialog("Browser delivery project")
      .getByRole("button", { name: "Remove access", exact: true })
      .click();
    await dialog("Remove project access")
      .getByRole("button", { name: "Remove project access", exact: true })
      .click();
    await page
      .getByText(
        "Reassign open tasks and resolve owned blockers before removing access.",
        { exact: true },
      )
      .waitFor();
    await dialog("Remove project access")
      .getByRole("button", { name: "Back", exact: true })
      .click();
    await dialog("Browser delivery project")
      .getByRole("button", { name: "Browser verified task", exact: true })
      .click();
    await dialog("Browser verified task")
      .getByRole("button", { name: "Start work", exact: true })
      .click();
    await confirm("Start task");
    await dialog("Browser verified task")
      .getByRole("button", { name: "Assign owner", exact: true })
      .click();
    await choose(dialog("Assign task"), "Task owner", "Sarah Connor (admin)");
    await confirm("Assign task");
    await dialog("Browser verified task")
      .getByRole("button", { name: "Raise blocker", exact: true })
      .click();
    await dialog("Raise blocker")
      .getByLabel("What is blocking delivery?")
      .fill("Waiting for provider");
    await choose(
      dialog("Raise blocker"),
      "Responsible person",
      "Alex Chen (member)",
    );
    await confirm("Raise blocker");
    await dialog("Browser verified task")
      .getByRole("button", { name: "Resolve blocker", exact: true })
      .click();
    await confirm("Resolve blocker");
    await dialog("Browser verified task")
      .getByRole("button", { name: "Reschedule", exact: true })
      .click();
    await dialog("Reschedule task")
      .getByLabel("New due date")
      .fill("2026-09-25");
    await dialog("Reschedule task")
      .getByLabel("Reason for rescheduling")
      .fill("Provider delay");
    await confirm("Reschedule task");
    const submit = async () => {
      await dialog("Browser verified task")
        .getByRole("button", { name: "Submit deliverable", exact: true })
        .click();
      await dialog("Submit deliverable")
        .getByLabel("Deliverable URL")
        .fill("https://example.test/delivery");
      await dialog("Submit deliverable")
        .getByLabel("Submission notes")
        .fill("Ready for review");
      await confirm("Submit deliverable");
    };
    await submit();
    await dialog("Browser verified task")
      .getByRole("button", { name: "Return for rework", exact: true })
      .click();
    await dialog("Return for rework")
      .getByLabel("Required changes")
      .fill("Add documentation");
    await confirm("Return for rework");
    await submit();
    await dialog("Browser verified task")
      .getByRole("button", { name: "Accept", exact: true })
      .click();
    await confirm("Accept deliverable");
    assert.equal(
      await dialog("Browser verified task")
        .getByRole("button", { name: "Cancel task", exact: true })
        .count(),
      0,
    );
    await page.screenshot({
      path: "test-results/admin-task-history.png",
      fullPage: true,
    });
    await dialog("Browser verified task")
      .getByRole("button", { name: "Browser delivery project", exact: true })
      .click();
    await dialog("Browser delivery project")
      .getByRole("button", { name: "Remove access", exact: true })
      .click();
    await confirm("Remove project access");
    await dialog("Browser delivery project")
      .getByRole("button", { name: "Close project", exact: true })
      .click();
    await confirm("Close project");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "All tasks", exact: true }).click();
    await page
      .getByRole("button", { name: "Create task", exact: true })
      .click();
    await choose(
      dialog("Create task"),
      "Project",
      "Identity & Access Engine (IAM v2)",
    );
    await dialog("Create task")
      .getByLabel("Task title")
      .fill("Cancel this browser task");
    await confirm("Create task");
    await page
      .getByRole("button", { name: "Cancel this browser task", exact: true })
      .click();
    await dialog("Cancel this browser task")
      .getByRole("button", { name: "Cancel task", exact: true })
      .click();
    await confirm("Cancel task");
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Team directory", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Record leave", exact: true })
      .click();
    await choose(dialog("Record leave"), "Person", "Alex Chen (member)");
    await dialog("Record leave").getByLabel("First day").fill("2026-09-01");
    await dialog("Record leave").getByLabel("Last day").fill("2026-09-05");
    await dialog("Record leave")
      .getByLabel("Note")
      .fill("Approved annual leave");
    await confirm("Record leave");
    await page.getByRole("button", { name: "Alex Chen", exact: true }).click();
    await dialog("Alex Chen")
      .getByText(/Approved annual leave/)
      .waitFor();
    await page.keyboard.press("Escape");
    for (const [nav, heading] of [
      ["Health analytics", "Delivery analytics"],
      ["Governance", "Governance"],
      ["Org risks", "Organization risks"],
      ["Activity ledger", "Activity ledger"],
    ]) {
      await page.getByRole("button", { name: nav, exact: true }).click();
      await page.getByRole("heading", { name: heading, exact: true }).waitFor();
    }
    await page
      .getByRole("button", { name: "project closed", exact: true })
      .first()
      .click();
    await dialog("Recorded change")
      .getByText("Reason: Project completed", { exact: true })
      .waitFor();
    await page.keyboard.press("Escape");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV", exact: true }).click();
    const download = await downloadPromise;
    await download.saveAs("test-results/admin-ledger.csv");
    assert.match(
      fs.readFileSync("test-results/admin-ledger.csv", "utf8"),
      /project_closed/,
    );
    await page.reload();
    await login();
    await page
      .getByRole("button", { name: "Browser delivery project", exact: true })
      .waitFor();
    await page.screenshot({
      path: "test-results/admin-portfolio.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("button", { name: "Expand navigation", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "New project", exact: true })
      .click();
    await dialog("Create project")
      .getByRole("button", { name: "Back", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Expand navigation", exact: true })
      .click();
    await page.getByRole("button", { name: "All tasks", exact: true }).click();
    await page
      .getByRole("heading", { name: "All tasks", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Expand navigation", exact: true })
      .click();
    await page.getByRole("button", { name: "Portfolio", exact: true }).click();
    await page
      .getByRole("heading", { name: "Portfolio operations", exact: true })
      .waitFor();
    await page.screenshot({
      path: "test-results/admin-mobile.png",
      fullPage: true,
    });
    assert.deepEqual(failures, []);
    console.log(
      "PASS: admin navigation, project/lead/access, task lifecycle, blocker, leave, ledger, CSV, and reload persistence; no browser errors.",
    );
  } catch (error) {
    await page.screenshot({
      path: "test-results/admin-failure.png",
      fullPage: true,
    });
    console.error((await page.locator("body").innerText()).slice(-5000));
    throw error;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
