import {Page, expect, firefox, type FullConfig } from '@playwright/test';
import { writeFileSync } from 'node:fs';


const adminFile = '.auth/admin.json';
const userFile = '.auth/user.json';

const fillSciperFieldsWithEnv = async (page: Page) => {
  if (process.env.CONNECT_AS_SCIPER) {
    await page.getByLabel('SCIPER:').click();
    await page.getByLabel('SCIPER:').fill(process.env.CONNECT_AS_SCIPER);
  }
}

const fillNameFieldsWithEnv = async (page: Page) => {
  if (process.env.CONNECT_AS_NAME) {
    await page.getByLabel('Display name:').click();
    await page.getByLabel('Display name:').fill(process.env.CONNECT_AS_NAME);
  }
}

const fillGroupsFieldsWithEnv = async (page: Page) => {
  if (process.env.CONNECT_AS_GROUPS) {
    await page.getByLabel('Groups (comma separated):').click();
    await page.getByLabel('Groups (comma separated):').fill(process.env.CONNECT_AS_GROUPS);
  }
}

async function globalSetup(config: FullConfig) {
  console.log('Logging as admin...');
  const { baseURL } = config.projects[0].use;
  const browser = await firefox.launch();

  const adminContext = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const adminPage = await adminContext.newPage();

  await adminPage.goto(baseURL!);
  await adminPage.waitForURL((url) => url.href.includes('cgi-bin/tequila/auth'))

  await fillSciperFieldsWithEnv(adminPage);
  await fillNameFieldsWithEnv(adminPage);

  await adminPage.getByRole('button', { name: 'Submit' }).click()
  await adminPage.waitForURL(baseURL!)
  // once near-fully loaded, we can see the user info button
  await expect(adminPage.locator('#user-info-button')).toBeVisible();

  // save context for later
  await adminPage.context().storageState({ path: adminFile });

  /**
   * USER
   */
  console.log('Logging as user...');
  // userContext and all pages inside, including userPage, are signed in as "user".
  const userContext = await browser.newContext({
      ignoreHTTPSErrors: true,
    });
  const userPage = await userContext.newPage();

  await userPage.goto(baseURL!);
  await userPage.waitForURL((url) => url.href.includes('cgi-bin/tequila/auth'));

  await fillSciperFieldsWithEnv(userPage);
  await fillNameFieldsWithEnv(userPage);
  await fillGroupsFieldsWithEnv(userPage);

  await userPage.getByText('Groups (comma separated):').click();
  await userPage.getByLabel('Groups (comma separated):').fill('');
  await userPage.getByRole('button', { name: 'Submit' }).click()
  await userPage.waitForURL(baseURL!)
  // once near-fully loaded, we can see the user info button
  await expect(userPage.locator('#user-info-button')).toBeVisible();

  // save context for later
  await userPage.context().storageState({ path: userFile });

  // Get session storage and store as env variable
  const sessionStorageUser: any = await userPage.evaluate(() => JSON.stringify(sessionStorage));
  writeFileSync('.auth/user_session.json', JSON.stringify(sessionStorageUser), 'utf-8');
  console.log(`All done for the user. saving  the context into ${userFile}...`);

  // end the browser as tests will start fresh
  await browser.close();
}

export default globalSetup;
