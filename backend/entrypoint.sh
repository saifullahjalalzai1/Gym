#!/usr/bin/env sh
set -e

PORT_VALUE="${PORT:-8000}"

is_true() {
  case "${1:-}" in
    1|true|TRUE|yes|YES|on|ON) return 0 ;;
    *) return 1 ;;
  esac
}

if is_true "${RUN_MIGRATIONS:-1}"; then
  python manage.py migrate --noinput
else
  echo "RUN_MIGRATIONS is disabled; skipping migrations."
fi

if is_true "${CREATE_SUPERUSER:-1}"; then
  python manage.py create_default_superuser
else
  echo "CREATE_SUPERUSER is disabled; skipping default superuser."
fi
python manage.py collectstatic --noinput

exec gunicorn gym.wsgi:application --bind 0.0.0.0:${PORT_VALUE}
