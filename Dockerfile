FROM node:10-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

EXPOSE 8000
ENV NODE_ENV=production PMT_PLATFORM=docker
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
COPY pmt-backend /usr/src/app/pmt-backend/
COPY pmt-data-access /usr/src/app/pmt-data-access/
COPY pmt-io /usr/src/app/pmt-io/
COPY pmt-validation /usr/src/app/pmt-validation/
RUN yarn --production install && \
	yarn cache clean && pwd && ls -l node_modules

# if node-gyp is needed, surround RUN with
# apk add --no-cache python make g++ && \
# 
# apk del --no-cache python make g++
