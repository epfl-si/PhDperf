DOCKER_BASE_IMAGE := ubuntu
DOCKER_BASE_TAG := focal
OPENSHIFT_BUILD_NAMESPACE := phd-assess-test

.PHONY: build
build:
	docker build -t node-base node-base/
	docker network inspect phd-assess-meteor-network >/dev/null 2>&1 || \
      docker network create --driver bridge phd-assess-meteor-network
	docker build -t phd-assess-meteor --network=phd-assess-meteor-network  .

.PHONY: pull
pull:
	docker pull camunda/zeebe:1.2.4

# TODO: we don't want to build locally and push; but currently we have
# to, for want of enough RAM.
.PHONY: push-meteor
push-meteor:
	oc whoami -t | docker login os-docker-registry.epfl.ch -u toto --password-stdin
	docker tag phd-assess-meteor os-docker-registry.epfl.ch/phd-assess-test/phd-assess-meteor:latest
	docker push os-docker-registry.epfl.ch/phd-assess-test/phd-assess-meteor:latest

.PHONY: push-zeebe
push-zeebe:
	oc whoami -t | docker login os-docker-registry.epfl.ch -u toto --password-stdin
	docker tag camunda/zeebe:1.2.4 os-docker-registry.epfl.ch/phd-assess-test/zeebe-broker:1.2.4
	docker push os-docker-registry.epfl.ch/phd-assess-test/zeebe-broker:1.2.4

.PHONY: push-node-base
push-node-base:
	oc whoami -t | docker login os-docker-registry.epfl.ch -u toto --password-stdin
	docker tag node-base os-docker-registry.epfl.ch/phd-assess-test/node-base:latest
	docker push os-docker-registry.epfl.ch/phd-assess-test/node-base:latest
