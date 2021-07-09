# PhD Assess

Provide form tasks to users, so they can fulfil their the PhD assessment process.

You can take a look at the process by installing the [BPMN Modeler](https://camunda.com/download/modeler/) and by opening [the process definition](bpmn-model/phdAssessProcess.bpmn).

Technically, the application consists on a Meteor server, defined as a [Zeebe](https://zeebe.io) worker. It shows all jobs of type `phdAssessFillForm` as a task/todo-list. A user can complete his/her form tasks through FormIO forms.

## Run

### Prerequiste

- Have docker & docker-compose
- [Have meteor](https://www.meteor.com/developers/install)
- Assert you have access to Keybase credentials, available in /keybase/team/epfl_phdassess.test/
- Copy the `.env` file from Keybase:
  ```
  cp /keybase/team/epfl_phdassess.test/env_local .env
  ```

### Start the Zeebe state server

- Download [zeebe-hazelcast-exporter-1.0.0-jar-with-dependencies.jar](https://github.com/camunda-community-hub/zeebe-hazelcast-exporter/releases) into ./docker/zeebe-hazelcast

- Download [postgresql-42.2.12.jar](https://jdbc.postgresql.org/download/postgresql-42.2.12.jar) into ./docker/simple-monitor

- Build and start the Zeebe server
  ```
  cd docker && docker-compose up
  ```

### Start the Web framework

  - Install dependencies
    ```
    meteor npm i
    ```
  - Start the server
    ```
    meteor run
    ```

### Deploy the workflow
  ```
  meteor node scripts/deployProcess.js
  ```

### Browse

  - Assert your VPN is on (needed for tequila authentication)
  - Assert you never use the https protocol while browsing (certainly after redirection from the first tequila authentication)
  - Open http://localhost:3000
