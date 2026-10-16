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
    assert.equal(
      await dialog(name).count(),
      1,
      `Expected single instance of dialog "${name}"`,
    );
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
    // Starting, submitting and raising blockers are the assignee's own actions.
    for (const name of ["Start work", "Submit deliverable", "Raise blocker"]) {
      assert.equal(
        await dialog("Browser verified task")
          .getByRole("button", { name, exact: true })
          .count(),
        0,
        `Admin must not see "${name}" on another person's task`,
      );
    }
    // Administrators are never task owners: they oversee, the manager does the work.
    await dialog("Browser verified task")
      .getByRole("button", { name: "Reassign owner", exact: true })
      .click();
    await dialog("Reassign task").getByLabel("Task owner").click();
    assert.equal(
      await page.getByRole("option", { name: "Sarah Connor (admin)", exact: true }).count(),
      0,
      "Admins must not be offered as task owners",
    );
    await page.getByRole("option", { name: "David Kim (manager)", exact: true }).click();
    await confirm("Reassign task");
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

    // Switch between the admin and the manager who owns the task.
    const signInAs = async (role) => {
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      if (role === "admin") return login();
      await page.getByRole("button", { name: "Fill", exact: true }).nth(1).click();
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.getByRole("button", { name: "My Work", exact: true }).click();
      await page.getByLabel("Options for Browser verified task").waitFor();
    };
    const managerMenu = async (item) => {
      await page.getByLabel("Options for Browser verified task").click();
      await page.getByRole("menuitem", { name: item, exact: true }).click();
    };
    const openTaskAsAdmin = async () => {
      await page
        .getByRole("button", { name: "Browser delivery project", exact: true })
        .first()
        .click();
      await dialog("Browser delivery project")
        .getByRole("button", { name: "Browser verified task", exact: true })
        .click();
    };
    const submitAsManager = async () => {
      await managerMenu("Submit for Review");
      const form = dialog("Submit Deliverable for Review");
      await form.getByLabel("Deliverable Link").fill("https://example.test/delivery");
      await form.getByLabel("Submission Notes").fill("Ready for review");
      await form.getByRole("button", { name: "Submit for Review", exact: true }).click();
      await form.waitFor({ state: "hidden" });
    };

    await signInAs("manager");
    await managerMenu("Start Work");
    await managerMenu("Raise Blocker");
    await choose(dialog("Raise Blocker"), "Who can clear it?", "Alex Chen (member)");
    await dialog("Raise Blocker")
      .getByLabel("Blocker Reason & Impact")
      .fill("Waiting for provider");
    await confirm("Raise Blocker");

    await signInAs("admin");
    await openTaskAsAdmin();
    await dialog("Browser verified task")
      .getByRole("button", { name: "Resolve blocker", exact: true })
      .click();
    await confirm("Resolve blocker");

    await signInAs("manager");
    await submitAsManager();

    await signInAs("admin");
    await openTaskAsAdmin();
    await dialog("Browser verified task")
      .getByRole("button", { name: "Return for rework", exact: true })
      .click();
    await dialog("Return for rework")
      .getByLabel("Required changes")
      .fill("Add documentation");
    await confirm("Return for rework");

    await signInAs("manager");
    await submitAsManager();

    await signInAs("admin");
    await openTaskAsAdmin();
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
    await page
      .getByRole("button", { name: "New project", exact: true })
      .click();
    await dialog("Create project")
      .getByLabel("Project name")
      .fill("Identity & Access Engine (IAM v2)");
    await dialog("Create project")
      .getByLabel("Goal and expected outcome")
      .fill("Core enterprise IAM infrastructure");
    await dialog("Create project").getByLabel("Start date").fill("2026-09-01");
    await dialog("Create project").getByLabel("Target date").fill("2026-10-31");
    await confirm("Create project");
    await page.getByRole("button", { name: "Tasks", exact: true }).click();
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
      .getByRole("button", { name: "Team", exact: true })
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
      ["Analytics", "Delivery analytics"],
      ["Governance", "Governance"],
      ["Risks", "Organization risks"],
      ["Activity", "Activity ledger"],
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
    // The portfolio lists active projects by default (FR-51); this one is closed.
    await page.getByText(/^Closed \(\d+\)$/).click();
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
    await page.getByRole("button", { name: "Tasks", exact: true }).click();
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
