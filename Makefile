DOCKER_BASE_IMAGE := ubuntu
DOCKER_BASE_TAG := focal
OPENSHIFT_BUILD_NAMESPACE := phd-assess

.PHONY: build
build:
	docker build -t docker-registry.default.svc:5000/$(OPENSHIFT_BUILD_NAMESPACE)/meteor-base:latest meteor-base/
	docker build -t docker-registry.default.svc:5000/$(OPENSHIFT_BUILD_NAMESPACE)/phd-assess-meteor:latest .


# TODO: we don't want to build locally and push; but currently we have
# to, for want of enough RAM.
.PHONY: push
push:
	docker tag docker-registry.default.svc:5000/phd-assess/phd-assess-meteor:latest os-docker-registry.epfl.ch/phd-assess/phd-assess-meteor:latest
	docker push os-docker-registry.epfl.ch/phd-assess/phd-assess-meteor:latest
