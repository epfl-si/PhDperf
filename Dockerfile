FROM docker-registry.default.svc:5000/phd-assess/meteor-mongo-base:latest

RUN mkdir -p /usr/src/app/
COPY . /usr/src/app/
WORKDIR /usr/src/app/
RUN meteor npm i && meteor npm run postinstall
RUN meteor build --allow-superuser /usr/bundle
RUN tar -C /usr -zxf /usr/bundle/app.tar.gz
WORKDIR /usr/bundle
RUN cd programs/server && npm install

FROM docker-registry.default.svc:5000/phd-assess/meteor-mongo-base:latest

COPY --from=0 /usr/bundle /usr/bundle/
WORKDIR /usr/bundle

CMD node main.js
