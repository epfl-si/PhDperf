FROM mongo:focal AS trunk

LABEL io.openshift.tags=mongodb,meteor,phd-assess
LABEL io.k8s.description="The PhD assess Meteor UI, to be connected to Zeebe"
LABEL version="1.0"

RUN set -e -x; export DEBIAN_FRONTEND=noninteractive; \
    apt-get -qy update && \
    apt-get install -y \
    curl \
  && rm -rf /var/lib/apt/lists/*

# get node+npm, to a specific version, as needed by meteor
ENV NODE_VERSION=14.17.6
ARG XDG_CONFIG_HOME=/home
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.38.0/install.sh | bash
ARG NVM_DIR=/home/nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ARG NODE_DIR="$NVM_DIR/versions/node/v${NODE_VERSION}/bin/"
ENV PATH="$NODE_DIR:${PATH}"

ARG APP_ROOT=/usr/bundle
COPY /dist/PhDAssess.tar.gz ${APP_ROOT}/app.tar.gz
WORKDIR /usr/bundle

# Set for Openshift user permissions
RUN chgrp -R 0 ${APP_ROOT} && \
    chmod -R g=u ${APP_ROOT}
RUN chmod -R a+rwx ${NODE_DIR} && \
    chgrp -R 0 ${NODE_DIR} && \
    chmod -R g=u ${NODE_DIR}
RUN mkdir -p /home/data/db \
    && chown -R mongodb:mongodb /home/data/db \
    && chmod -R 777 /home/data/db

RUN tar -C /usr -zxf app.tar.gz && rm app.tar.gz
RUN cd programs/server && npm install --production

# Set a user, like Openshift do
USER 10000
EXPOSE 3000

### user name recognition at runtime w/ an arbitrary uid - for OpenShift deployments
#ENTRYPOINT [ "uid_entrypoint" ]
CMD mongod --dbpath /home/data/db & node main.js
