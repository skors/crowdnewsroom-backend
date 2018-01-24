# Crowdnewsroom

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

If you did not choose docker or set a different path you may need to edit the `DATABASES` config in `crowdnewsroom/settings.py`

### Run migrations
```bash
python manage.py migrate
```

### Create a superuser
```bash
python manage.py createsuperuser
```

### Run intial migrations
```bash
python manage.py migrate
```

## Running
```bash
python manage.py runserver
```