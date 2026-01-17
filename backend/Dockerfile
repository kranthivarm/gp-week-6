FROM node:18-alpine

#Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app
COPY package.json .
RUN npm install

COPY . .
EXPOSE 8000

CMD ["npm", "start"]
