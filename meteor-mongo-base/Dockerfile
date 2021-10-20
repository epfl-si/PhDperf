FROM ubuntu:focal

# build-essential:
RUN set -e -x; export DEBIAN_FRONTEND=noninteractive; \
    apt -qy update; \
    apt -qy install curl build-essential git openssh-client

RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - && apt-get install -y nodejs

# not recommended by the Meteor guide
RUN curl https://install.meteor.com/ | sh

# If you want to run MongoDB in-docker for some reason (e.g. you have a persistent
# volume, or you don't care about persistence in the first place):
RUN curl https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -
RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-5.0.list
RUN set -e -x; export DEBIAN_FRONTEND=noninteractive; \
    apt -qy update; \
    apt -qy install mongodb-org
