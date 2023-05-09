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
- the GED uploader
- the Email sender
- the PDF builder

### Frontend

- the task filler
    - Meteor app with two mongo bases
    - see ./apps/fillForm


## Where to start ?

How about launching the app locally ?

- Build the docker images:
`docker compose -f ./docker/docker-compose.yml build    `
- Launch the Zeebe server with:
`docker compose -f ./docker/docker-compose.yml up zeebe_node_0 zeebe_node_1 zeebe_node_2`
- Once Zeebe is running (`watch zbctl status --insecure --port 26501`, you can deploy the bpmn on it.
  If you want the default one, use:
`./phd.mjs deploy-bpmn`
- Now prepare the first start the meteor app:
`cd apps/fillForm`
`cp .env.sample .env` and start editing the .env
`meteor npm i`
`meteor --settings settings.json`
- Then, use your browser on `http://localhost:3000/`
