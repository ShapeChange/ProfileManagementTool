FROM node:6-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

EXPOSE 8000
ENV NODE_ENV=production
CMD [ "node", "server.js" ]

# Build inside container
# Install app dependencies and build app
#COPY . /usr/src/app/
#RUN npm --only=dev install && \
#	npm --production run build && \
#	npm --production prune && \
#	npm --production install && \
#	npm cache clear

# Build outside of container
# Install app dependencies
COPY dist /usr/src/app/
RUN apk add --no-cache python make g++ && \
    npm --production install && \
	npm test && \
	npm cache clear && \
	apk del --no-cache python make g++


