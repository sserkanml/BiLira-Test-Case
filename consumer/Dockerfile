FROM node:20-alpine 

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# Add init script
COPY init-topics.sh .
RUN chmod +x init-topics.sh

# Use shell script as entrypoint
ENTRYPOINT ["./init-topics.sh"]