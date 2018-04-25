# Crowdnewsroom [![Build Status](https://travis-ci.org/correctiv/crowdnewsroom-backend.svg?branch=master)](https://travis-ci.org/correctiv/crowdnewsroom-backend)

This is the backend for the crowdnewsroom.


## Goal

The crowdnewsroom allows journalists to create investigations in which many citizens can contribute by filling out forms to collect data.

## Setup

### Python setup
```bash
virtualenv -p python3.6 venv
source venv/bin/activate
pip install -r requirements.txt
```

### Database
You need to set up a postgres database. Django supports many types of databases but we want to use Postgres' JSONB feature
to store user replies as JSON blobs for flexibility.
You can set up a database natively or with docker. To set it up with docker run:
```bash
docker run --name crowdnewsroom-docker -d -p 32770:5432 postgres
docker exec -it crowdnewsroom-docker createdb -U postgres crowdnewsroom
```

## Settings

Move `crowdnewsroom/local_settings.py.example` to `crowdnewsroom/local_settings.py` and update the settings according to your local environment, in case you are not using docker.

You also need to set a couple of environment variables. Namely:
```
DJANGO_SECRET_KEY='<your generated secret key>'
DJANGO_ALLOWED_HOSTS='localhost' # can be comma-separated
```

### Run migrations
```bash
python manage.py migrate
```

### Create a superuser
```bash
python manage.py createsuperuser
```

### Get example data
To load some example data that contains an investigation with a corresponding form you can run
```bash
python manage.py loaddata investigation_and_form
```

## Running
```bash
python manage.py runserver
```

## Test
You can run the test suite with
```bash
python manage.py test
```

## License
The source code for this project is published under [GNU AGPL License](https://github.com/correctiv/crowdnewsroom-backend/blob/master/LICENSE)

## About
This project uses [BrowserStack](https://www.browserstack.com/) for cross-browser testing and [Crowdin](https://crowdin.com) for translations. Cheers to these tools to support non-profit and Open Source initiatives.

