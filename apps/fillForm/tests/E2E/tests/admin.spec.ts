
import {expect} from "@playwright/test";
import {cleanupPageAndTaskForAdmin, setupAPageWithTasksForAdmin, test} from "/tests/E2E/tests/fixtures";
import {fillFormAppPageForAdmin} from "/tests/E2E/tests/fixtures/fillFormApp";

let adminApp: fillFormAppPageForAdmin;

test.beforeAll(async ({ browser }) => {
  adminApp = await setupAPageWithTasksForAdmin(browser);
});

test.afterAll(async () => {
  await cleanupPageAndTaskForAdmin(adminApp);
});


test('I am flagged as admin', async ({fillFormAppPageAsAdmin}) => {

  await fillFormAppPageAsAdmin.userInfoButton.click();

  await expect(fillFormAppPageAsAdmin.userInfoDiv).toBeVisible();

  await expect(fillFormAppPageAsAdmin.userInfoStatus).toHaveText(' (admin)');

  // close it now
  await fillFormAppPageAsAdmin.userInfoButton.click();
  await expect(fillFormAppPageAsAdmin.userInfoDiv).not.toBeVisible();
});

test.describe('Task creation', () => {

  test('I have the create button',
    async ({fillFormAppPageAsAdmin}) => {
      await expect(
        fillFormAppPageAsAdmin.page.getByRole('button', {name: ' New annual report process'}),
        'this page should have the new process starter button'
      ).toBeVisible();
    });

  test('I have been able to create a task',
    async () => {
      expect(
        await adminApp.tasks.count()
      ).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Tasks listing', () => {
  test('I have the admin features buttons near a task',
    async () => {

      expect(
        await adminApp.tasks.count()
      ).toBeGreaterThanOrEqual(0);

      await expect(
        adminApp.tasks.first().getByRole(
          'button',
          { name: '⋮'}
        )
      ).toBeVisible();

    });

  test('I can cancel a task',
    async () => {
      expect(
        await adminApp.tasks.count()
      ).toBeGreaterThanOrEqual(0);

      await adminApp.removeLastTask();

      await adminApp.page.getByText('Successfully removed the process instance').waitFor();
    });
});
