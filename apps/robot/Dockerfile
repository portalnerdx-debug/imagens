FROM mcr.microsoft.com/playwright:v1.55.0-noble
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN mkdir -p playwright/.auth
ENV NODE_ENV=production
ENV CLICK_HEADLESS=true
EXPOSE 8081
CMD ["npm","run","start"]
