#!/usr/bin/env sh
set -e

PORT_VALUE="${PORT:-8000}"

python manage.py migrate --noinput
python manage.py create_default_superuser
python manage.py collectstatic --noinput

exec gunicorn gym.wsgi:application --bind 0.0.0.0:${PORT_VALUE}
