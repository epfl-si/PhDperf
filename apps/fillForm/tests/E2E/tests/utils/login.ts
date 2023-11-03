import {expect, Page} from '@playwright/test';

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

export const loginAsUser = async (page: Page) => {
  await page.goto('/');
  await page.waitForURL((url) => url.href.includes('cgi-bin/tequila/auth'));

  await fillSciperFieldsWithEnv(page);
  await fillNameFieldsWithEnv(page);
  await fillGroupsFieldsWithEnv(page);

  await page.getByText('Groups (comma separated):').click();
  await page.getByLabel('Groups (comma separated):').fill('');
  await page.getByRole('button', { name: 'Submit' }).click()
  await page.waitForURL('/')
  // once near-fully loaded, we can see the user info button
  await expect(page.locator('#user-info-button')).toBeVisible();
}

export const loginAsAdmin = async (page: Page) => {
  await page.goto('/');
  await page.waitForURL((url) => url.href.includes('cgi-bin/tequila/auth'))

  await fillSciperFieldsWithEnv(page);
  await fillNameFieldsWithEnv(page);

  await page.getByRole('button', { name: 'Submit' }).click()
  await page.waitForURL('/')
  // once near-fully loaded, we can see the user info button
  await expect(page.locator('#user-info-button')).toBeVisible();
}
