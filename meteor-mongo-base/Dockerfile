FROM ubuntu:focal

RUN set -e -x; export DEBIAN_FRONTEND=noninteractive; \
    apt -qy update; \
    apt -qy install curl gnupg

RUN set -e -x; curl https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -; \
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-5.0.list; \
   export DEBIAN_FRONTEND=noninteractive; \
    apt -qy update; \
    apt -qy install mongodb-org

RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - && apt-get -qy install nodejs

# not recommended by the Meteor guide
RUN curl https://install.meteor.com/ | sh
