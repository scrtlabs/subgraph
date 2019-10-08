# Enigma Subgraph

## Running Graph Node

The Docker Compose setup requires an Ethereum network name and node
to connect to. By default, it will use `mainnet:http://host.docker.internal:9545`
in order to connect to an Ethereum node running on your host machine.
You can replace this with anything else in `docker-compose.yaml`.

> **Note for Linux users:** On Linux, `host.docker.internal` is not
> currently supported. Instead, you will have to replace it with the
> IP address of your Docker host (from the perspective of the Graph
> Node container).
> To do this, run:
>
> ```
> CONTAINER_ID=$(docker container ls | grep graph-node | cut -d' ' -f1)
> docker exec $CONTAINER_ID /bin/bash -c 'ip route | awk \'/^default via /{print $3}\''
> ```
>
> This will print the host's IP address. Then, put it into `docker-compose.yml`:
>
> ```
> sed -i -e 's/host.docker.internal/<IP ADDRESS>/g' docker-compose.yml
> ```

After you have set up an Ethereum node—e.g. Ganache or Parity—simply
clone this repository and run

```sh
docker-compose up
```

This will start IPFS, Postgres and Graph Node in Docker and create persistent
data directories for IPFS and Postgres in `./data/ipfs` and `./data/postgres`. You
can access these via:

- Graph Node:
  - GraphiQL: `http://localhost:8000/`
  - HTTP: `http://localhost:8000/subgraphs/name/<subgraph-name>`
  - WebSockets: `ws://localhost:8001/subgraphs/name/<subgraph-name>`
  - Admin: `http://localhost:8020/`
- IPFS:
  - `127.0.0.1:5001` or `/ip4/127.0.0.1/tcp/5001`
- Postgres:
  - `postgresql://graph-node:let-me-in@localhost:5432/graph-node`