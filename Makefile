serve:
	. venv/bin/activate; python manage.py runserver& cd theme; yarn run dev

migrate:
	. venv/bin/activate; python manage.py migrate
