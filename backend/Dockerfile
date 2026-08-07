# ===== backend/Dockerfile =====
FROM python:3.13-slim

WORKDIR /app

# System deps for psycopg2 and image handling
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       libpq-dev \
       gcc \
       python3-dev \
       libjpeg-dev \
       zlib1g-dev \
       libpq5 \
       libjpeg62-turbo \
       zlib1g \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir \
    django==5.2.6 \
    djangorestframework==3.16.1 \
    djangorestframework-simplejwt==5.5.1 \
    drf-spectacular==0.28.0 \
    PyJWT==2.10.1 \
    psycopg2-binary==2.9.10 \
    dj-database-url==2.3.0 \
    celery==5.5.3 \
    redis==6.4.0 \
    django-cors-headers==4.9.0 \
    whitenoise==6.11.0 \
    gunicorn==23.0.0 \
    sentry-sdk==2.35.0 \
    django-ratelimit==4.1.0 \
    python-dotenv==1.1.1 \
    sqlparse==0.5.3 \
    packaging==25.0

# Copy project source
COPY . .

RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]
