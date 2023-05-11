# PhD Assess

This is an apps stack to allow students to fulfil their PhD assessment process.

## Structure

The stack is composed of:

### Operative tools

./ansible, to deploy
./scripts, to work

### Backends

- the Zeebe stack
    - a raft of three Zeebes 
    - the BPMN
      - You can take a look at the process by installing the [BPMN Modeler](https://camunda.com/download/modeler/) and by opening [the process definition](https://github.com/epfl-si/PhDAssess-meta/blob/main/bpmn/phdAssessProcess.bpmn).
- the GED uploader, as a nodeJS worker
- the Email sender, as a nodeJS worker
- the PDF builder, as a nodeJS worker

### Frontend

- the task filler
    - Meteor app with two mongo bases
    - see code source at ./apps/fillForm


## Where to start ?

How about launching the app locally ?

- Build the docker images:
  `docker compose -f ./docker/docker-compose.yml build zeebe_node_0 zeebe_node_1 zeebe_node_2`
- Launch the Zeebe server with:
  `docker compose -f ./docker/docker-compose.yml up zeebe_node_0 zeebe_node_1 zeebe_node_2`
- Once Zeebe is running (`watch zbctl status --insecure --port 26501`, you can deploy the bpmn on it.
  If you want the default one, use:
  `./phd.mjs deploy-bpmn`
- Now prepare the first start of the meteor app:
  - `cd apps/fillForm`
  - `cp .env.sample .env` and start editing the .env
  -  install the libs `meteor npm i`
  - start the app `meteor --settings settings.json`
- Then, use your browser on `http://localhost:3000/` and start some workflows.
- In a later time, if you want the other microservices, clone the services in the parent directory of this project and use:
  `docker compose -f ./docker/docker-compose.yml up pdf notifier`
