FROM node:18-alpine

WORKDIR /expenses-manager/app

COPY package*.json ./

RUN npm install -g react-native-cli

RUN npm install -f --silent

CMD [ "npm","run","android"]