FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application code
COPY . .

# Build the app (for production) or just expose for dev
EXPOSE 5173

# We'll override this in docker-compose for dev
CMD ["npm", "run", "dev", "--", "--host"]
