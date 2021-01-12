start:
	docker-compose up -d kafka postgres
	docker-compose up rest_api

stop:
	docker-compose down

clean: stop
	sudo rm -rf ./.docker-data/kafka
	sudo rm -rf ./.docker-data/pg
	docker-compose up -d kafka postgres

