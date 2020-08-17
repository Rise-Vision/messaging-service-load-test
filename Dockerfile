FROM node:latest

WORKDIR /app

COPY index.js ./
COPY simulated-display.js ./
COPY package*.json ./

RUN npm install --production

EXPOSE 80
ENTRYPOINT [ "node", "index.js" ]
