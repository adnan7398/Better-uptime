FROM oven/bun:1

WORKDIR /repo
COPY . .
RUN bun install --frozen-lockfile
RUN cd packages/store && bunx prisma generate

WORKDIR /repo/apps/scheduler
CMD ["bun", "run", "index.ts"]
