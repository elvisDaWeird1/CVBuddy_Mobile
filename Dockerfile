FROM node:22-alpine

WORKDIR /app

RUN addgroup -S cvbuddy && adduser -S cvbuddy -G cvbuddy

COPY package*.json ./
RUN npm ci

COPY --chown=cvbuddy:cvbuddy . .

USER cvbuddy

CMD ["npm", "run", "validate"]
