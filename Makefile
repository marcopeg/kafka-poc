start:
	humble up -d
	npm install
	npm start

stop:
	humble down

clean: stop
	sudo rm -rf ./.docker-data/kafka
	sudo rm -rf ./.docker-data/pg
	humble up -d

