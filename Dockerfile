FROM node:18

WORKDIR /app
COPY . /app

RUN yarn install

CMD ["yarn", "start"]
