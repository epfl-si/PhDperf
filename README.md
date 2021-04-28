# PhDAssess

## Credentials

### Keybase

Test credentials are available in /keybase/team/epfl_phdassess.test/

Here is one way to wield them to create a workflow:

```
. /keybase/team/epfl_phdassess.test/env ; zbctl create instance "PhDAssessmentv1" --variables '{"term": "2021H2"}'
```

### .env

In order to start up the Meteor server, you first need to copy the `.env` file from Keybase :

```
cp /keybase/team/epfl_phdassess.test/env .env
```

## Run locally

```
meteor npm i
meteor
```

### Debug info
```
DEBUG=*,-babel,-compression-connect*,-combined-stream2 DEBUG_COLORS=yes meteor run
```

See https://www.npmjs.com/package/debug for details
