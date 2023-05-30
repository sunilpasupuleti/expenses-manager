FROM node:18-alpine

WORKDIR /expenses-manager/backend

COPY package*.json ./

COPY . .

ENV PORT=3000 \
    FIREBASE_DATABASE_URL=https://expensesmanager-da065-default-rtdb.firebaseio.com/ \
    FIREBASE_STORAGE_BUCKET=expensesmanager-da065.appspot.com \
    LOGPATH=logs \
    MONGO_DATABASE_DEV=development \
    MONGO_DATABASE_PRODUCTION=production \
    MONGO_DATABASE_URL=mongodb+srv://sunil:Sunil%40123@cluster0.lrqxoge.mongodb.net/<database>?retryWrites=true&w=majority

RUN npm install -g nodemon
RUN npm install -f --silent

EXPOSE 3000

CMD ["npm","run","start"]
