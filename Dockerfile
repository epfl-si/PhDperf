FROM ubuntu:focal AS trunk

# build-essential:
RUN set -e -x; export DEBIAN_FRONTEND=noninteractive; \
    apt -qy update; \
    apt -qy install curl build-essential git openssh-client

RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - && apt-get install -y nodejs

FROM trunk AS build

# not recommended by the Meteor guide
RUN curl https://install.meteor.com/ | sh

# If you want to run MongoDB in-docker for some reason (e.g. you have a persistent
# volume, or you don't care about persistence in the first place):
RUN curl https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -
RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-5.0.list
RUN set -e -x; export DEBIAN_FRONTEND=noninteractive; \
    apt -qy update; \
    apt -qy install mongodb-org

RUN mkdir -p /usr/src/app/
COPY . /usr/src/app/
WORKDIR /usr/src/app/
RUN meteor npm i && meteor npm run postinstall
RUN meteor build --allow-superuser /usr/bundle
RUN tar -C /usr -zxf /usr/bundle/app.tar.gz
WORKDIR /usr/bundle
RUN cd programs/server && npm install

FROM trunk AS run

COPY --from=build /usr/bundle /usr/bundle/
WORKDIR /usr/bundle

CMD node main.js
