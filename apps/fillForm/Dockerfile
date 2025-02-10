ARG BASE_IMAGE=docker-registry.default.svc:5000/phd-assess-test/node-base:latest

FROM $BASE_IMAGE AS build-stage

ENV NODE_ENV=production

# to ignore caniuse-lite outdated warning
ENV BROWSERSLIST_IGNORE_OLD_DATA=1

# not recommended by the Meteor guide, but still works:
RUN curl https://install.meteor.com/ | sh

# build-essential needed at build time, but not run time:
RUN apt-get update && apt-get install -y \
    sudo \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 meteoruser && \
    useradd -u 1001 -g meteoruser -m -s /bin/bash meteoruser

RUN mkdir -p /app/.meteor/local
RUN chown -R meteoruser:meteoruser /app

USER meteoruser

WORKDIR /app
COPY --chown=meteoruser:meteoruser . .

RUN meteor npm install --production
RUN meteor build --directory /app/output
RUN meteor npm run postinstall

FROM $BASE_IMAGE

RUN groupadd -g 1001 meteoruser && \
    useradd -u 1001 -g meteoruser -m -s /bin/bash meteoruser

WORKDIR /app

COPY --from=build-stage /app/output/bundle /app

RUN cd /app/programs/server && npm install --production

RUN chown -R meteoruser:meteoruser /app

USER meteoruser

CMD ["node", "main.js"]
