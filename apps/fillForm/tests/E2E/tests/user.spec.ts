import {expect} from '@playwright/test';
import {cleanupPageAndTaskForUser, setupAPagWithATaskForUser, test} from './fixtures';
import {fillFormAppPageForUser} from "/tests/E2E/tests/fixtures/fillFormApp";


let userApp: fillFormAppPageForUser;

test.beforeAll(async ({ browser }) => {
  userApp = await setupAPagWithATaskForUser(browser);
});

test.afterAll(async () => {
  await cleanupPageAndTaskForUser(userApp.page);
});


test('I should not be flagged as admin', async ({ fillFormAppPageAsUser }) => {
  await fillFormAppPageAsUser.page.locator('#user-info-button').click()

  await expect(fillFormAppPageAsUser.userInfoDisplayName).toBeVisible();

  await expect(fillFormAppPageAsUser.userInfoStatus).not.toBeVisible();
});

test('I should not have the new process starter button', async ({ fillFormAppPageAsUser }) => {
  // Expect a title "to contain" a substring.
  await expect(fillFormAppPageAsUser.createTaskButton).not.toBeVisible();
});

test.describe('Tasks listing', () => {

  test('I should not have the admin features buttons near a task',
    async () => {
      await expect(
        userApp.tasks.first().locator('#dropdown-task-row-actions'),
      ).not.toBeVisible();
    });

  test('I can proceed a task and come back',
    async () => {
      await userApp.tasks.first().getByRole('button', {name: 'Proceed'}).first().click()

      await userApp.page.waitForURL((url) => url.href.includes('/tasks/'))

      await expect(
        userApp.page.locator('.formio-component-form').first(),
      ).toBeVisible();

      // get back to list
      await userApp.page.getByRole('button', { name: 'Cancel' }).click();
      await userApp.page.waitForURL('/')

      // once near-fully loaded, we can see the user info button
      //await expect(this.userInfoButton).toBeVisible();

      await expect(
        userApp.page.getByRole(
          'link',
          { name: 'Tasks to do' }
        )).toHaveCSS(
        'font-weight',
        '700'
      )
    });
});

test.describe('Form', () => {
  test('I can fulfill assigning participant with success',
  async () => {
    await expect(userApp.tasksAssign).toHaveCount(1);

    await userApp.proceedToLastTask();

    await expect(userApp.submitButton).toBeDisabled()

    expect(process.env.CONNECT_AS_SCIPER).toBeDefined()

    await userApp.fillAssigningParticipant(process.env.CONNECT_AS_SCIPER!);

    await expect(userApp.submitButton).not.toBeDisabled();

    await userApp.submitButton.click();

    await expect(userApp.page.getByRole('button', { name: 'Back' })).toBeVisible();

    await userApp.page.getByRole('button', { name: 'Back' }).click();

    await userApp.page.waitForURL('/');

    await expect(userApp.tasksToBeCompleted_1_2).toHaveCount(1, { timeout: 20*1000 })
  });
});
