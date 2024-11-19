import {Browser, BrowserContext, Page, test as base} from '@playwright/test';

import {fillFormAppPageForUser, fillFormAppPageForAdmin} from "/tests/E2E/tests/fixtures/fillFormApp";
import {loginAsAdmin} from "/tests/E2E/tests/utils/login";


type FillFormAppFixtures = {
  fillFormAppPageAsUser: fillFormAppPageForUser;
  fillFormAppPageAsAdmin: fillFormAppPageForAdmin;
};

export const test = base.extend<FillFormAppFixtures>({
  fillFormAppPageAsUser: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: '.auth/user.json' });
    const fillFormAppPageAsUser = new fillFormAppPageForUser(await context.newPage());

    await use(fillFormAppPageAsUser);

    await context.close();
  },
  fillFormAppPageAsAdmin: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: '.auth/admin.json' });
    const fillFormAppPageAsAdmin = new fillFormAppPageForAdmin(await context.newPage());

    await use(fillFormAppPageAsAdmin);

    await context.close();
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

export const setupUserAndAdminContexts = async (browser: Browser) => {
  // adminContext and all pages inside, including adminPage, are signed in as "admin".
  const adminContext = await browser.newContext({ storageState: '.auth/admin.json' });
  const adminPage = await adminContext.newPage();

  // userContext and all pages inside, including userPage, are signed in as "user".
  const userContext = await browser.newContext({ storageState: '.auth/user.json' });
  const userPage = await userContext.newPage();

  return {
    adminContext,
    adminPage,
    userContext,
    userPage,
  }
}

export const tearDownUserAndAdminContexts = async (
    adminContext: BrowserContext, userContext: BrowserContext
) => {
  await adminContext.close();
  await userContext.close();
}
