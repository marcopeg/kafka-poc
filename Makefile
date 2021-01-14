clean: stop
	sudo rm -rf ./.docker-data/kafka
	sudo rm -rf ./.docker-data/pg
	docker-compose up -d kafka postgres

stop:
	docker-compose down

start-services:
	docker-compose up -d kafka postgres

start: start-services
	docker-compose up rest_api

restart: clean start

logs:
	docker-compose logs -f rest_api

tdd-e2e:
	docker-compose up tdd_e2e