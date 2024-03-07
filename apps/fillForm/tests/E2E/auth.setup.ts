import { test as setup } from '@playwright/test';
import {fillFormAppPageForAdmin, fillFormAppPageForUser} from "/tests/E2E/tests/fixtures/fillFormApp";

const adminFile = '.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  const fillFormAppPageAsAdmin = new fillFormAppPageForAdmin(page);

  await fillFormAppPageAsAdmin.login()

  // save context for later
  await page.context().storageState({ path: adminFile });
});

const userFile = '.auth/user.json';

setup('authenticate as user', async ({ page }) => {
  const fillFormAppPageAsUser = new fillFormAppPageForUser(page);

  await fillFormAppPageAsUser.login()

  // save context for later
  await page.context().storageState({ path: userFile });
});
