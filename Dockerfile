FROM mongo:focal AS trunk

# build-essential:
RUN set -e -x; export DEBIAN_FRONTEND=noninteractive; \
    apt -qy update; \
    apt -qy install curl build-essential git openssh-client

# get node+npm, to a specific version, as needed by meteor
ARG NODE_VERSION=14.17.5
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.38.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"

FROM trunk AS build
ENV SUDO_USER=root
RUN mkdir /home/root
RUN npm install -g meteor -unsafe-perm

RUN mkdir -p /usr/src/app/
COPY . /usr/src/app/
WORKDIR /usr/src/app/
ENV METEOR_ALLOW_SUPERUSER=1
RUN /home/root/.meteor/meteor npm i && /home/root/.meteor/meteor npm run postinstall
RUN METEOR_DISABLE_OPTIMISTIC_CACHING=1 /home/root/.meteor/meteor build /usr/bundle
RUN tar -C /usr -zxf /usr/bundle/app.tar.gz
RUN rm /usr/bundle/app.tar.gz

FROM trunk AS run

COPY --from=build /usr/bundle /usr/bundle/
# remove once in prod, this is to get the meteor command

WORKDIR /usr/bundle
RUN cd programs/server && npm install

WORKDIR /usr/bundle

EXPOSE 3000

CMD mongod & node main.js
