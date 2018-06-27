#!/bin/sh

django-admin makemessages --locale=en --locale=de --ignore=env
django-admin makemessages -d djangojs -l de -l en --ignore 'theme/node_modules/*'

