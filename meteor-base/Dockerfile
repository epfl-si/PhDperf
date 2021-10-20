FROM ubuntu:focal

RUN set -e -x; export DEBIAN_FRONTEND=noninteractive; \
    apt -qy update; \
    apt -qy install curl gnupg

RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - && apt-get -qy install nodejs

# not recommended by the Meteor guide
RUN curl https://install.meteor.com/ | sh
