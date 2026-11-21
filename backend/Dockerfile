FROM python:3.12-slim

# System dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Run collectstatic during build
RUN python manage.py collectstatic --no-input || true

# Environment variables
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Start command: migrate, seed admin user, and start gunicorn on Render's $PORT
CMD ["sh", "-c", "python manage.py migrate --no-input && python seed_demo_data.py || true && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT} --workers 2"]
