FROM mongo:focal AS trunk

# build-essential:
RUN set -e -x; export DEBIAN_FRONTEND=noninteractive; \
    apt -qy update; \
    apt -qy install curl build-essential git openssh-client

RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - && apt-get install -y nodejs

FROM trunk AS build

# not recommended by the Meteor guide
RUN curl https://install.meteor.com/ | sh

RUN mkdir -p /usr/src/app/
COPY . /usr/src/app/
WORKDIR /usr/src/app/
RUN meteor npm i && meteor npm run postinstall
RUN meteor build --allow-superuser /usr/bundle
RUN tar -C /usr -zxf /usr/bundle/app.tar.gz
RUN rm /usr/bundle/app.tar.gz
WORKDIR /usr/bundle
RUN cd programs/server && npm install

FROM trunk AS run

COPY --from=build /usr/bundle /usr/bundle/
WORKDIR /usr/bundle

EXPOSE 3000

CMD mongod & node main.js
