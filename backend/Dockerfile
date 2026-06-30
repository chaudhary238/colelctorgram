# CollectorHub API — portable container (runs on Railway and any VM/VPS unchanged)
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install from pyproject. Copy source first so the package metadata resolves;
# the app is small enough that a single install layer is fine.
COPY pyproject.toml alembic.ini ./
COPY alembic ./alembic
COPY app ./app
RUN pip install .

# Run as non-root
RUN useradd --create-home --uid 1000 appuser
USER appuser

EXPOSE 8000

# Default: run migrations then start the server. This is exec-form `sh -c`, so the shell
# interprets `&&` and `${PORT}` properly — unlike Render's Docker Command field, which
# execs without a shell. Railway still overrides this via railway.toml startCommand;
# Render should leave its Docker Command BLANK so this CMD is used.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
