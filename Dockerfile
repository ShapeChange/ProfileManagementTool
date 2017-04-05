FROM node:6-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

EXPOSE 8000
ENV NODE_ENV=production
CMD [ "node", "dist/server.js" ]

# Install app dependencies and build app
COPY . /usr/src/app/
RUN npm --only=dev install && \
	npm --production run build && \
	npm --production prune && \
	npm --production install && \
	npm cache clear



