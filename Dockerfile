FROM node:6.11.3

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

# Run github
RUN apt-get update
RUN apt-get install -y git

RUN mkdir /root/.ssh

COPY id_rsa /root/.ssh/id_rsa
# RUN chmod 700 /root/.ssh/id_rsa
# RUN chown -R root:root /root/.ssh

RUN touch /root/.ssh/known_hosts
# Add bitbuckets key
RUN ssh-keyscan github.com >> /root/.ssh/known_hosts


RUN git clone git@github.com:Chrome-River/mercury.git

RUN cd mercury && npm install
# RUN npm install --global bower
# RUN cd mercury && bower install



COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .


EXPOSE 8080
CMD [ "node", "server.js" ]