FROM oven/bun:1

WORKDIR /repo
COPY . .
RUN bun install --frozen-lockfile

WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["bunx", "next", "dev", "--turbopack", "--port", "3000", "--hostname", "0.0.0.0"]
