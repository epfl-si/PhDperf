import {expect} from '@playwright/test';
import {
  cleanupPageAndTaskForUser,
  setupAPagWithTasksForUser,
  test
} from './fixtures';
import {fillFormAppPageForUser} from "/tests/E2E/tests/fixtures/fillFormApp";


let userApp: fillFormAppPageForUser;

test.beforeAll(async ({ browser }) => {
  userApp = await setupAPagWithTasksForUser(browser);
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

  test('I can progress a task', async () => {

    await test.step('I can assign participants', async () => {

      await expect(userApp.tasksAssign).toHaveCount(2);
      await userApp.proceedToLastTask();

      await expect(userApp.submitButton).toBeDisabled()

      await userApp.fillAssigningParticipant();

      await expect(userApp.submitButton).not.toBeDisabled();

      await userApp.submitButton.click();
      await expect(userApp.page.getByRole('button', { name: 'Back' })).toBeVisible();
      await userApp.page.getByRole('button', { name: 'Back' }).click();

      await userApp.page.waitForURL('/');
    });

    await test.step('I got a new task after assigning participants', async () => {
      const connectedAs = process.env.CONNECT_AS_SCIPER
      const assignedTo = process.env.PARTICIPANT_PHD_STUDENT

      expect(
        connectedAs &&
        assignedTo &&
        connectedAs == assignedTo,
      `As the task has been assigned to the student ${ assignedTo },
       you have to log with this sciper to make the next step valid. Currently connected as: ${ connectedAs }`
      ).toBeTruthy()

      await expect(userApp.tasksToBeCompleted).toHaveCount(1, { timeout: 20*1000 })

      const studentName = userApp.tasksToBeCompleted.first()
        .locator('.task-phdstudent-name');
      await expect(studentName).not.toBeEmpty();

      const studentSciper = userApp.tasksToBeCompleted.first()
        .locator('.task-phdstudent-sciper');

      await expect(studentSciper).not.toBeEmpty();
    });

  });
});

test.describe('Dashboard', () => {

  test('Tasks visibility',
    async () => {

      if (!await userApp.tasksToBeCompleted.count()) {
        await userApp.moveInitialTaskToAnnualReportToBeCompletedStep();
      }

      // need two tasks without inter lapping participants
      await expect(userApp.tasksAssign).toHaveCount(2);

      await userApp.goToDashboard();

      await expect(userApp.dashboard).not.toBeEmpty();
    });

});
