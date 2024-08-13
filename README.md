# PhD Assess

This is an apps stack to allow students to fulfil their PhD assessment process.

## Structure

The stack is composed of:

### Operative tools
- `./phd.mjs`, to command
- `./ansible/`, to deploy
- `./scripts/`, to hack

### Backends
- the Zeebe stack
    - a raft of three Zeebes 
    - the BPMN
      - You can take a look at the process by installing the [BPMN Modeler](https://camunda.com/download/modeler/) and by opening [the process definition](https://github.com/epfl-si/PhDAssess-meta/blob/main/bpmn/phdAssessProcess.bpmn).
- the GED uploader, as a nodeJS worker
- the Email sender (aka notifier), as a nodeJS worker
- the PDF builder, as a nodeJS worker
- the ISA connector, as a nodeJS worker

### Frontend
- the task filler
    - Meteor app with two mongo bases
    - see code source at ./apps/fillForm


## Where to start ?

How about launching the app locally ?

### Zeebe

- Build the docker images:
  - `docker compose -f ./docker/docker-compose.yml build zeebe_node_0 zeebe_node_1 zeebe_node_2`
- Launch the Zeebe server with:
  - `docker compose -f ./docker/docker-compose.yml up zeebe_node_0 zeebe_node_1 zeebe_node_2`
- Once Zeebe is running (`watch zbctl status --insecure --port 26501`, you can deploy the bpmn on it.
  You can use this command to help with the process:
  - `./phd.mjs deploy-bpmn`

### Micro-services

- In the parent directory of this projet, clone the other services:
  - `cd ..`
  - `git clone https://github.com/epfl-si/phdAssess-PDF`
  - `git clone https://github.com/epfl-si/phdAssess-Notifier`
  - `git clone https://github.com/epfl-si/phdAssess-GED`
  - `git clone https://github.com/epfl-si/phdAssess-ISA`
- Come back into the projet folder
  - `cd PhDAssess`
- Build and start the services
  - `docker compose -f ./docker/docker-compose.yml build pdf notifier ged isa`
  - `docker compose -f ./docker/docker-compose.yml up pdf notifier ged isa`

### Main app

- Start of the meteor app:
  - `cd ./apps/fillForm`
  - install the libs with `meteor npm i`
  - `cp .env.sample .env` and start editing the .env to your taste
  - start the app with `meteor --settings settings.json` and open your browser on `http://localhost:3000/`

### Workflow map
- Build and start the service:
  - `docker compose -f ./docker/docker-compose.yml build simple-monitor`
  - `docker compose -f ./docker/docker-compose.yml up simple-monitor`
- Open `http://localhost:8082/`
