FROM mcr.microsoft.com/playwright:v1.62.1-noble
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY tsconfig.json ./
COPY src ./src
RUN mkdir -p playwright/.auth
ENV NODE_ENV=production
ENV CLICK_HEADLESS=true \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
EXPOSE 8081
CMD ["npm","run","start"]
