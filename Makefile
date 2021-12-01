DOCKER_BASE_IMAGE := ubuntu
DOCKER_BASE_TAG := focal
OPENSHIFT_BUILD_NAMESPACE := phd-assess-test

# This is the target for developers. Note that we don't build Meteor
# as a Docker image (as we presume the developer intends to modify it;
# hence, s•he is going to run it directly)
.PHONY: build
build: build-simple-monitor

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

.PHONY: logs
logs:
	cd docker && docker-compose logs -f

.PHONY: down
down:
	cd docker && docker-compose down

# The remainder of the targets are intended for “old-style” pushes (we
# would prefer to do all of that in OpenShift; but currently we can't,
# for want of enough RAM).
.PHONY: build-meteor
build-meteor:
	docker build -t node-base node-base/
# Need to go through a Docker network, so as to obtain epfl-sti-react-library
# out of the on-premise NPM server:
	docker network inspect phd-assess-meteor-network >/dev/null 2>&1 || \
           docker network create --driver bridge phd-assess-meteor-network
	docker build -t phd-assess-meteor --network=phd-assess-meteor-network  .

.PHONY: push-meteor
push-meteor:
	oc whoami -t | docker login os-docker-registry.epfl.ch -u toto --password-stdin
	docker tag phd-assess-meteor os-docker-registry.epfl.ch/phd-assess-test/phd-assess-meteor:latest
	docker push os-docker-registry.epfl.ch/phd-assess-test/phd-assess-meteor:latest
