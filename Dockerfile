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

COPY /dist/PhDAssess.tar.gz /usr/bundle/app.tar.gz
WORKDIR /usr/bundle
RUN tar -C /usr -zxf app.tar.gz
RUN rm app.tar.gz

RUN cd programs/server && npm install

EXPOSE 3000

CMD mongod & node main.js
