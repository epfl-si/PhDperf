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
	@ if ! oc projects >/dev/null 2>&1; then echo 'Please log into OpenShift first with `oc login`'; exit 1; fi
	oc whoami -t | docker login os-docker-registry.epfl.ch -u toto --password-stdin
	docker pull os-docker-registry.epfl.ch/phd-assess-test/zeebe-broker-with-exporters

# TODO: we don't want to build locally and push; but currently we have
# to, for want of enough RAM.
.PHONY: push-meteor
push-meteor:
	oc whoami -t | docker login os-docker-registry.epfl.ch -u toto --password-stdin
	docker tag phd-assess-meteor os-docker-registry.epfl.ch/phd-assess-test/phd-assess-meteor:latest
	docker push os-docker-registry.epfl.ch/phd-assess-test/phd-assess-meteor:latest
