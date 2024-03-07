import {Browser, Page, test as base} from '@playwright/test';

import {fillFormAppPageForUser, fillFormAppPageForAdmin} from "/tests/E2E/tests/fixtures/fillFormApp";
import {loginAsAdmin} from "/tests/E2E/tests/utils/login";


type FillFormAppFixtures = {
  fillFormAppPageAsUser: fillFormAppPageForUser;
  fillFormAppPageAsAdmin: fillFormAppPageForAdmin;
};

export const test = base.extend<FillFormAppFixtures>({
  fillFormAppPageAsUser: async ({ page }, use) => {
    const fillFormAppPageAsUser = new fillFormAppPageForUser(page);

    await fillFormAppPageAsUser.login()

    await use(fillFormAppPageAsUser);
  },
  fillFormAppPageAsAdmin: async ({ page }, use) => {
    const fillFormAppPageAsAdmin = new fillFormAppPageForAdmin(page);

    await fillFormAppPageAsAdmin.login()

    await use(fillFormAppPageAsAdmin);
  },
});

export const setupAPageWithTasksForAdmin = async (browser: Browser) => {
  const page = await browser.newPage();
  const fillFormAppPageAsAdmin = new fillFormAppPageForAdmin(page);

  await fillFormAppPageAsAdmin.login()
  await fillFormAppPageAsAdmin.setupTwoTasks();

  return fillFormAppPageAsAdmin;
}

export const cleanupPageAndTaskForAdmin = async (app: fillFormAppPageForAdmin) => {
  await app.removeAllTasks();
  await app.page.close();
}

export const setupAPagWithTasksForUser = async (browser: Browser) => {
  const page = await browser.newPage();
  const fillFormAppPageAsAdmin = new fillFormAppPageForAdmin(page);

  await fillFormAppPageAsAdmin.login()
  await fillFormAppPageAsAdmin.setupTwoTasks();

  const fillFormAppPageAsUser = new fillFormAppPageForUser(page);
  await fillFormAppPageAsUser.login()
  return fillFormAppPageAsUser;
}

export const cleanupPageAndTaskForUser = async (page: Page) => {
  await loginAsAdmin(page);  // relog, as the last account was user
  const fillFormAppPageAsAdmin = new fillFormAppPageForAdmin(page);
  await fillFormAppPageAsAdmin.removeAllTasks();
  await fillFormAppPageAsAdmin.page.close();
}
