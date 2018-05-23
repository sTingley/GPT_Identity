FROM node:latest

WORKDIR /usr/src/app
RUN cd /usr/src/app

ENV USE_DOCKER true

COPY . .

RUN npm install yarn
RUN yarn install
RUN npm install

ENTRYPOINT ["node", "index.js"]

CMD [""]

EXPOSE 8080