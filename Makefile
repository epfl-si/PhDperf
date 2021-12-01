DOCKER_BASE_IMAGE := ubuntu
DOCKER_BASE_TAG := focal
OPENSHIFT_BUILD_NAMESPACE := phd-assess-test

.PHONY: build
build:
	docker build -t node-base node-base/
# Need to go through a Docker network, so as to obtain epfl-sti-react-library
# out of the on-premise NPM server:
	docker network inspect phd-assess-meteor-network >/dev/null 2>&1 || \
           docker network create --driver bridge phd-assess-meteor-network
	docker build -t phd-assess-meteor --network=phd-assess-meteor-network  .
	$(MAKE) build-simple-monitor

.PHONY: build-simple-monitor
build-simple-monitor: docker/simple-monitor/postgresql-42.2.12.jar
	docker build -t epfl-idevfsd/simple-monitor docker/simple-monitor

docker/simple-monitor/postgresql-42.2.12.jar:
	wget -O $@ https://jdbc.postgresql.org/download/postgresql-42.2.12.jar

.PHONY: pull
pull:
	@ if ! oc projects >/dev/null 2>&1; then echo 'Please log into OpenShift first with `oc login`'; exit 1; fi
	oc whoami -t | docker login os-docker-registry.epfl.ch -u toto --password-stdin
	docker pull os-docker-registry.epfl.ch/phd-assess-test/zeebe-broker-with-exporters

.PHONY: up
up:
	@mkdir -p docker/volumes/{simple-monitor-data,zeebe_data} || true
	cd docker && docker-compose up -d

# TODO: we don't want to build locally and push; but currently we have
# to, for want of enough RAM.
.PHONY: push-meteor
push-meteor:
	oc whoami -t | docker login os-docker-registry.epfl.ch -u toto --password-stdin
	docker tag phd-assess-meteor os-docker-registry.epfl.ch/phd-assess-test/phd-assess-meteor:latest
	docker push os-docker-registry.epfl.ch/phd-assess-test/phd-assess-meteor:latest
