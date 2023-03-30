# PhD Assess

This is an apps stack to allow students to fulfil their the PhD assessment process.

## Structure

The stack is composed of:

### Operative tools

./ansible, to deploy  
./scripts, to work  

### Backends

- the Zeebe stack
    - a solo Zeebe in dev, a raft in prod
    - the BPMN
      - You can take a look at the process by installing the [BPMN Modeler](https://camunda.com/download/modeler/) and by opening [the process definition](bpmn-model/phdAssessProcess.bpmn).
- the GED uploader
- the email sender
- the pdf file builder

### Frontend

- the task filler
    - Meteor app with two mongo bases
    - see ./apps/fillForm


## Where to start ?

How about launching the app locally ?

First launch the Zeebe server with:
`cd docker && docker-compose up zeebe_node_0 zeebe_node_1 zeebe_node_2`.
Once it is running, prepare the first start the meteor app:
`cd apps/fillForm`
`cp .env.sample .env` and start editing the .env
`meteor npm i`
`meteor start --settings settings.json`
Then, use your browser on `http://localhost:3000/`
