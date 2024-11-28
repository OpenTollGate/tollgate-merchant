FROM denoland/deno:latest

WORKDIR /app

ADD . /app

RUN deno cache main.ts

CMD ["run", "--allow-net", "--allow-env", "--allow-sys", "--allow-read", "--allow-run", "main.ts"]

