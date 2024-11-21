FROM node:20-alpine3.19

# Update and install necessary dependencies
RUN apk update && \
    apk upgrade && \
    apk add --no-cache git bash python3 make gcc g++

# Clone the repository
RUN git clone https://github.com/azaidi4/footyhead.git

# Set working directory to the server folder
WORKDIR /footyhead/client

# Install dependencies
RUN npm install

# Install tsx globally if needed
RUN npm install -g tsx

# Expose the application port
EXPOSE 8080

# Start the server
ENTRYPOINT ["npm", "run", "start-client"]
