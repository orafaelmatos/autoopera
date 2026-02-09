# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy project
COPY . /app/

# Create media and static directories and set permissions
RUN mkdir -p /app/media /app/backend_static && chmod -R 777 /app/media /app/backend_static

# Expose port
EXPOSE 8000

# Start command
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "barberflow.wsgi:application"]
