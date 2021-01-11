start:
	docker-compose up -d
	npm install
	npm start

stop:
	docker-compose down

clean: stop
	sudo rm -rf ./.docker-data/kafka
	sudo rm -rf ./.docker-data/pg
	docker-compose up -d

