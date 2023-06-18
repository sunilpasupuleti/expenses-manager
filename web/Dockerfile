FROM node:18-alpine

WORKDIR /expenses-manager/web

COPY package*.json ./

COPY . .

RUN npm install -f --silent


CMD ["npm","run","build"]

FROM httpd:alpine

WORKDIR /var/www/html/expenses-manager
COPY --from=build /build/build/ .