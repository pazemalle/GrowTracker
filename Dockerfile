FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the frontend application
RUN npm run build

# Create a directory to store the persistent SQLite database
RUN mkdir -p /app/data

# Expose the API port
EXPOSE 3001

# Set the environment variables
ENV NODE_ENV=production
ENV PORT=3001
# Map the SQLite DB file to the persistable directory
ENV DB_PATH=/app/data/growtracker.db

# Start the Node.js backend server
CMD ["node", "server/index.js"]
