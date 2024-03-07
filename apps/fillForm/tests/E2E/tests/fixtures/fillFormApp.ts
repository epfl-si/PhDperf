import {Page, Locator, expect} from '@playwright/test';
import {loginAsAdmin, loginAsUser} from "/tests/E2E/tests/utils/login";


export class fillFormAppPageBase {

  readonly page: Page;

  readonly navigation: {
    dashboard: Locator
  }

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

  // task currently under the 'Annual report to be completed' grouper
  readonly tasksToBeCompleted: Locator;

  /**
   * Form
   */
  readonly submitButton: Locator;

  /**
   * Dashboard
   */
  readonly dashboard: Locator;
  readonly dashboardFirstRow: Locator;


  constructor(page: Page) {
    this.page = page

    this.navigation = {
      dashboard: page.locator('#nav-aside a[href*="/dashboard"]')
    }

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

    this.tasksToBeCompleted = this.page
      .locator('.tasksGrouper')
      .filter({ has: page.getByRole('heading', {name: 'Annual report to be completed'}) })
      .locator('.task');

    this.submitButton = page
      .getByRole('button', {name: 'Submit'});

    this.dashboard = page
      .locator('.dashboard');

    this.dashboardFirstRow = page
      .locator('.dashboard .row').first();
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

  async createTask() {
    await this.createTaskButton.click();

    await expect(this.page.getByText('New workflow created').first()).toBeVisible();
  }

  /**
   * Form
   */

  async fillAssigningParticipant(
    participants = {
      programAssistantSciper: process.env.PARTICIPANT_PROGRAM_ASSISTANT ?? '111111',
      phdStudentSciper: process.env.PARTICIPANT_PHD_STUDENT ?? '111111',
      thesisDirectorSciper: process.env.PARTICIPANT_THESIS_DIRECTOR ?? '111111',
      thesisCoDirectorSciper: process.env.PARTICIPANT_THESIS_CODIRECTOR ?? '111111',
      programDirectorSciper: process.env.PARTICIPANT_PROGRAM_DIRECTOR ?? '111111',
      mentorSciper: process.env.PARTICIPANT_MENTOR ?? '111111',
    }
  ) {

    await this.page
      .getByLabel('Program assistant sciper').click();
    await this.page
      .getByLabel('Program assistant sciper')
      .fill(participants.programAssistantSciper);

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
      .fill(participants.phdStudentSciper);

    await this.page
      .getByLabel('Thesis director sciper').click();
    await this.page
      .getByLabel('Thesis director sciper')
      .fill(participants.thesisDirectorSciper);

    await this.page
      .getByLabel('Thesis co-director sciper').click();
    await this.page
      .getByLabel('Thesis co-director sciper')
      .fill(participants.thesisCoDirectorSciper);

    await this.page
      .getByLabel('Program director sciper').click();
    await this.page
      .getByLabel('Program director sciper')
      .fill(participants.programDirectorSciper);

    await this.page
      .getByLabel('Mentor sciper').click();
    await this.page
      .getByLabel('Mentor sciper')
      .fill(participants.mentorSciper);

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

  async moveInitialTaskToAnnualReportToBeCompletedStep() {
    await expect(this.tasksToBeCompleted).toHaveCount(1);
    await expect(this.tasksAssign).toHaveCount(1);
    await this.proceedToLastTask();

    await this.fillAssigningParticipant();
    await this.submitButton.click();

    await this.page.waitForURL('/');
  }

  /**
   * Dashboard
   */
  async goToDashboard() {
    await this.navigation.dashboard.click()
    await this.page.waitForURL('/dashboard');

    await expect(
      this.navigation.dashboard
    ).toHaveCSS(
      'font-weight',
      '700'
    )
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

  async setupTwoTasks() {
    if (await this.tasksAssign.count() < 1) {
      await this.createTask();
    }

    if (await this.tasksAssign.count() < 2) {
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
