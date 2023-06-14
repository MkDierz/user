# Use an official Node runtime as a parent image
FROM node:16-alpine

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Install nodemon for hot reloading
RUN npm install -g nodemon

# Bundle app source
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run prisma generate
RUN npx prisma generate

# Run the app when the container launches
CMD ["nodemon", "./bin/start.js"]
# CMD ["node", "./bin/start.js"]
