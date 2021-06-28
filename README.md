# PhD Assess

Provide form tasks to users, so they can fulfil their [the PhD assessment process](bpmn-model/PhD Assessment - Annual Review.bpmn).

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

### State server

- Install and start the Zeebe server
  ```
  git clone https://github.com/camunda-community-hub/zeebe-docker-compose ../zeebe-docker-compose
  cd ../zeebe-docker-compose/simple-monitor/ && docker-compose up
  ```
- Deploy the workflow
  ```
  ../zeebe-docker-compose/bin/zbctl --insecure deploy ./bpmn-model/PhD\ Assessment\ -\ Annual\ Review.bpmn
  ```

### Web framework

  - Install dependencies
    ```
    meteor npm i
    ```
  - Choose how to start the server
    - with debug logs:
      ```
      DEBUG=*,-babel,-compression-connect*,-combined-stream2 DEBUG_COLORS=yes meteor run
      ```
    - without debug logs:
      ```
      meteor run
      ```

### Browse

  - Assert your VPN is on (needed for tequila authentication)
  - Assert you never use the https protocol while browsing (certainly after redirection from the first tequila authentication)
  - Open http://localhost:3000
