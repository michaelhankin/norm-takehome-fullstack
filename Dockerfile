# Use the official Python image from the Docker Hub
FROM python:3.11-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory inside the container
WORKDIR /norm-fullstack

# Copy the dependencies file to the working directory
COPY pyproject.toml uv.lock ./

# Install any dependencies
RUN uv sync --frozen --no-cache

# Copy the content of the local src directory to the working directory
COPY ./app /norm-fullstack/app
COPY ./docs /norm-fullstack/docs

# Command to run on container start
CMD ["/norm-fullstack/.venv/bin/fastapi", "run", "app/main.py", "--port", "80", "--host", "0.0.0.0"]