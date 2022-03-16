# PhD Assess

Provide form tasks to users, so they can fulfil their the PhD assessment process.

You can take a look at the process by installing the [BPMN Modeler](https://camunda.com/download/modeler/) and by opening [the process definition](bpmn-model/phdAssessProcess.bpmn).

Technically, the application consists on a Meteor server, defined as a [Zeebe](https://zeebe.io) worker. It shows all jobs of type `phdAssessFillForm` as a task/todo-list. A user can complete his/her form tasks through FormIO forms.

## Run

### Prerequiste

- Have docker & docker-compose
- [Have meteor](https://www.meteor.com/developers/install)
- Assert you have access to Keybase credentials, available in /keybase/team/epfl_phdassess.test/
- Read the .env.sample and create a copy as `.env`:
  ```
  cp .env.sample .env
  ```
- Edit the `.env` to suit your needs
- (Optional) Edit `settings.json` to put your own identity into the fake Tequila server.

### Start the support infrastructure

The support infrastructure is required for the Meteor app to function (in addition to Meteor's usual, internally-managed requirement of a MongoDB database). It consists of Zeebe (the persistent store for workflow data and metadata), the zeebe-simple-monitor, and PostgreSQL (required by the latter for persistence).

```
make pull build up logs
```

### Start the Web framework

  - Install dependencies
    ```
    meteor npm i
    ```
  - Start the server
    ```
    meteor run --settings settings.json
    ```

### Deploy the workflow
  ```
  meteor node scripts/deployProcess.js
  ```

### Browse

  - Assert your VPN is on (needed for tequila authentication)
  - Assert you never use the https protocol while browsing (certainly after redirection from the first tequila authentication)
  - Open http://localhost:3000

### Stop the support infrastructure

```
make down
```
