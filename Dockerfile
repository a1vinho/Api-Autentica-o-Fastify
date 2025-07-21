FROM node:lts-alpine AS build

WORKDIR /api

COPY package*.json ./

COPY .env /api/

COPY . .

RUN apk update && npm install 

FROM node:lts-alpine as end_image 

WORKDIR /api
COPY --from=build ./api ./

EXPOSE 8080

CMD [ "npm", "start" ]