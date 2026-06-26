FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Ensure we use ts-node for development or build for production
# For this project, we'll assume development mode with ts-node
EXPOSE 3001

CMD ["npm", "run", "dev"]
