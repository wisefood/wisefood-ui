DOCKER=docker
IMGTAG=wisefood/wisefood-ui:latest

.PHONY: all build push

all: build push

build:
	$(DOCKER) build . -t $(IMGTAG)

push:
	$(DOCKER) push $(IMGTAG)