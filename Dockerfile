# Use Node.js 20 base image
FROM node:20-slim

# Install system dependencies for canvas and other modules
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy app source
COPY . .

# Expose the web port (default in config seems to involve express/localhost:3000)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
