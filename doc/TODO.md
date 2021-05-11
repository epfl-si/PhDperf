# Mainly
- from 30s polling to continious polling (aka long polling option) ?
  - is that compatible with the "claim task per server" scenario ?

- ✔ Redo first form, so we select all participant
  - ✔️seperate every participant sciper in instances variables through the first form
    - ✔ encrypt - decrypt
    - get a self-formation on Tequila-Meteor
    - add an admin (all in IDEV-FSD group) view that shows all
    - client should receive only his jobs

- list permissions inside one file, be less than 300 lines for easy auditing

- add the floating status to tasks that are on cache but not on Zeebe server anymore

- find a way to get a local Operate that *feels good*
  - https://docs.camunda.io/docs/product-manuals/zeebe/deployment-guide/kubernetes/operator/zeebe-operator
  - decrypt fields directly, or with firefox plugin, or with whatever
  - https://github.com/camunda-community-hub/zeebe-simple-monitor

- assert logs are auditable post-workflow

# Beautify

- Change text to Elements logos for zeebe status
