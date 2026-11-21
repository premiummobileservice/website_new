#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "📦 Installing backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn whitenoise

echo "🎨 Collecting static files..."
python manage.py collectstatic --no-input

echo "🗄️ Applying database migrations..."
python manage.py migrate --no-input

echo "🌱 Seeding demo accounts and initial data..."
python seed_demo_data.py || true

echo "✅ Backend build finished successfully!"
