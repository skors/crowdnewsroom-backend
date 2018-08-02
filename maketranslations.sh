#!/bin/sh

django-admin makemessages --locale=en --locale=de --ignore=env
python manage.py makemessages_djangojs -l de -l en --ignore 'theme/node_modules/*' --ignore 'theme/static/*' --ignore 'htmlcov/*' --domain djangojs --extension jsx --language Python

