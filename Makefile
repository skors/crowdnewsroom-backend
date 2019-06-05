serve:
	. venv/bin/activate; env CNR_FRONTEND_BASE_URL=http://localhost:3000 python manage.py runserver& cd theme; yarn run dev

migrate:
	. venv/bin/activate; python manage.py migrate
