DOCKER_BASE_IMAGE := ubuntu
DOCKER_BASE_TAG := focal
OPENSHIFT_BUILD_NAMESPACE := phd-assess

.PHONY: build
build:
	docker build -t docker-registry.default.svc:5000/$(OPENSHIFT_BUILD_NAMESPACE)/node-base:latest node-base/
	docker network inspect phd-assess-meteor-network >/dev/null 2>&1 || \
      docker network create --driver bridge phd-assess-meteor-network
	docker build -t docker-registry.default.svc:5000/$(OPENSHIFT_BUILD_NAMESPACE)/phd-assess-meteor:latest --network=phd-assess-meteor-network  .

.PHONY: pull
pull:
	docker pull camunda/zeebe:1.2.2

# TODO: we don't want to build locally and push; but currently we have
# to, for want of enough RAM.
.PHONY: push
push: push-meteor push-zeebe

.PHONY: push-meteor
push-meteor:
	oc whoami -t | docker login os-docker-registry.epfl.ch -u toto --password-stdin
	docker tag docker-registry.default.svc:5000/phd-assess/phd-assess-meteor:latest os-docker-registry.epfl.ch/phd-assess/phd-assess-meteor:latest
	docker push os-docker-registry.epfl.ch/phd-assess/phd-assess-meteor:latest

.PHONY: push-zeebe
push-zeebe:
	oc whoami -t | docker login os-docker-registry.epfl.ch -u toto --password-stdin
	docker tag camunda/zeebe:1.2.2 os-docker-registry.epfl.ch/phd-assess/zeebe-broker:1.2.2
	docker push os-docker-registry.epfl.ch/phd-assess/zeebe-broker:1.2.2
