import {Page, Locator, expect} from '@playwright/test';
import {loginAsAdmin, loginAsUser} from "/tests/E2E/tests/utils/login";


export class fillFormAppPageBase {

  readonly page: Page;

  readonly userInfoButton: Locator;
  readonly userInfoDiv: Locator;
  readonly userInfoDisplayName: Locator;
  readonly userInfoStatus: Locator;

  /**
   * List
   */
  readonly createTaskButton: Locator;
  readonly tasks: Locator;

  // task currently under the 'Assigning participants' grouper
  readonly tasksAssign: Locator;

  // task currently under the 'Annual report 1 of 2' grouper
  readonly tasksToBeCompleted_1_2: Locator;

  /**
   * Form
   */
  readonly submitButton: Locator;


  constructor(page: Page) {
    this.page = page

    this.userInfoButton = page
      .locator('#user-info-button');

    this.userInfoDiv = page
      .locator('#user-info');
    this.userInfoDisplayName = page
      .locator('#user-info-displayname')
    this.userInfoStatus = page
      .locator('#user-info-status');

    this.createTaskButton = page
      .getByRole('button', {name: ' New annual report process'});

    //this.tasks = this.page.getByRole('button', {name: 'Proceed'});
    this.tasks = this.page
      .locator('.task')

    this.tasksAssign = this.page
     .locator('.tasksGrouper')
     .filter({ has: page.getByRole('heading', {name: 'Assigning participants'}) })
     .locator('.task');

    this.tasksToBeCompleted_1_2 = this.page
      .locator('.tasksGrouper')
      .filter({ has: page.getByRole('heading', {name: 'Annual report to be completed part 1 of 2'}) })
      .locator('.task');

    this.submitButton = page
      .getByRole('button', {name: 'Submit'});
  }

  async teardown() {
    await this.removeAllTasks();
  }

  async removeAllTasks() {
  }

  /**
   * List
   */
  async goToList() {
    await this.page.waitForURL('/')

    // once near-fully loaded, we can see the user info button
    //await expect(this.userInfoButton).toBeVisible();

    await expect(
      this.page.getByRole(
        'link',
        { name: 'Tasks to do' }
      )).toHaveCSS(
      'font-weight',
      '700'
    )
  }

  async proceedToLastTask() {
    await this.page.getByRole('button', {name: 'Proceed'}).last().click();
    await this.page.waitForURL((url) => url.href.includes('/tasks/'))
  }

  /**
   * Form
   */

  async fillAssigningParticipant() {

    await this.page
      .getByLabel('Program assistant sciper').click();
    await this.page
      .getByLabel('Program assistant sciper')
      .fill(process.env.PARTICIPANT_PROGRAM_ASSISTANT ?? '111111');

    await this.page
      .getByPlaceholder('ED__').click();
    await this.page
      .getByPlaceholder('ED__')
      .fill(process.env.PARTICIPANT_DOCTORAL_PROGRAM ?? 'SOME');

    await this.page
      .getByLabel('Doctoral program’s administrative office email').click();
    await this.page
      .getByLabel('Doctoral program’s administrative office email')
      .fill(process.env.PARTICIPANT_OFFICE_EMAIL ?? 'some@email.to');

    await this.page
      .getByPlaceholder('example : https://www.epfl.ch/education/phd/edam-advanced-manufacturing/edam-annual-report/').click();
    await this.page
      .getByPlaceholder('example : https://www.epfl.ch/education/phd/edam-advanced-manufacturing/edam-annual-report/')
      .fill(process.env.PARTICIPANT_DOC_URL ?? 'www.my.doc');

    await this.page
      .getByLabel('Doctoral candidate sciper').click();
    await this.page
      .getByLabel('Doctoral candidate sciper')
      .fill(process.env.PARTICIPANT_PHD_STUDENT ?? '111111');

    await this.page
      .getByLabel('Thesis director sciper').click();
    await this.page
      .getByLabel('Thesis director sciper')
      .fill(process.env.PARTICIPANT_THESIS_DIRECTOR ?? '111111');

    await this.page
      .getByLabel('Thesis co-director sciper').click();
    await this.page
      .getByLabel('Thesis co-director sciper')
      .fill(process.env.PARTICIPANT_THESIS_CODIRECTOR ?? '111111');

    await this.page
      .getByLabel('Program director sciper').click();
    await this.page
      .getByLabel('Program director sciper')
      .fill(process.env.PARTICIPANT_PROGRAM_DIRECTOR ?? '111111');

    await this.page
      .getByLabel('Mentor sciper').click();
    await this.page
      .getByLabel('Mentor sciper')
      .fill(process.env.PARTICIPANT_MENTOR ?? '111111');

    //await this.page.getByPlaceholder('__', { exact: true }).click();
    await this.page
      .getByLabel('Credits needed for this program:').click();
    await this.page
      .getByLabel('Credits needed for this program:')
      .fill(process.env.PARTICIPANT_CREDITS_NEEDED ?? '42');

  }

  async submit() {
    await this.page.getByRole('button', {name: 'Submit'}).click();
  }

  async createTask() {
    await this.createTaskButton.click();

    await expect(this.page.getByText('New workflow created')).toBeVisible();
  }
}

export class fillFormAppPageForUser extends fillFormAppPageBase {
  async login() {
    await loginAsUser(this.page)
  }
}

export class fillFormAppPageForAdmin extends fillFormAppPageBase {
  async login() {
    await loginAsAdmin(this.page)
  }

  async assertOrCreateATask() {
    if (await this.tasks.count() == 0) {
      await this.createTask();
    }
  }

  async removeLastTask() {
    await this.page.getByRole('button', { name: '⋮'}).last().click();

    this.page.once('dialog', dialog => {
      dialog.accept();
    });

    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  async removeAllTasks() {
    while ((await this.tasks.count()) > 0) {
      await this.removeLastTask()
    }
  }
}
