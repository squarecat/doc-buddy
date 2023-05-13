# Using most recent LTS version of debian slim
FROM node:lts-slim

# Create app home directory and appuser, so code execution isn't as root.
ENV APP_HOME /usr/src/app
RUN useradd appuser --shell /bin/bash --no-log-init --create-home --home $APP_HOME

# Switching to appuser
USER appuser

# Current directory app directory
WORKDIR $APP_HOME

# Install app dependencies
COPY --chown=appuser [ "package.json", "yarn.lock", "./"]
RUN yarn install

# Copy over files
# Using separate step in order to allow caching, if the code changes but dependencies don't
COPY --chown=appuser ["index.js", "prompt.md", "./"]
COPY --chown=appuser ["src", "./src"]

# Default run command
CMD ["node", "index.js"]