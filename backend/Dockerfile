FROM node:18-alpine

WORKDIR /expenses-manager/backend

COPY package*.json ./

COPY . .

RUN npm install -g nodemon
RUN npm install -f --silent

EXPOSE 3000

CMD ["npm","run","start"]
