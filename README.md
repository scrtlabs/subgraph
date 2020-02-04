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
> docker exec $CONTAINER_ID /bin/bash -c 'ip route | awk "/^default via /{print $3}"'
> ￼
> ```
>
> This will print the host's IP address. Then, put it into `docker-compose.yml`:
>
> ```
> sed -i -e 's/host.docker.internal/<IP ADDRESS>/g' docker-compose.yml
> ```

### Steps to start the subgraph locally

#### Install the dependencies

```
yarn install
```

#### Generate the code from the subgraph schema

```
yarn codegen
```

#### Start the subgraph locally

```
yarn start-local
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

#### Create the subgraph `enigmampc/enigma`

Run this in a different terminal

```
yarn create-local
```

#### Deploy the subgraph

```
yarn deploy-local
```

This is the last step, from now on you should see all the data being created.

## To run a clean subgraphs session

- Remove the `data/`, `build/` and `generated/` folders:
  ```
  sudo rm -rf data build generated
  ```
- Re-generate the code, and restart:
  ```
  yarn codegen && yarn start-local
  ```
- Wait for the previous command to finish starting up and re-deploy:
  ```
  yarn create-local && yarn deploy-local
  ```

## To update current subgraphs

- Do the proper changes to the code
- Re-generate the code, and restart:
  ```
  yarn codegen && yarn start-local
  ```
- Wait for the previous command to finish starting up and re-deploy:
  ```
  yarn deploy-local
  ```

## Changing Network

For changing the network where the contrac is deployed, you need to:

- Update the following entries in the manifest (`subgraph.yaml`)

  - dataSources.network: network to use, i.e. `kovan` or `mainnet`
  - dataSources.source.address: Enigma smart contract address
  - dataSources.source.startBlock: block number where Enigma contract was deployed

- Update `services.graph-node.environment.ethereum` with `'<network>:<ethereum-rpc-url>'` i.e. `ethereum: 'kovan:https://kovan.infura.io/v3/PROJECT_ID'`

then

```bash
$ rm -rf data build generated
$ yarn codegen
$ yarn deploy-local
```

## Depoy to The Graph Hosted Service

#### Create a Graph Explorer account

Before using the hosted service, create an account in The Graph Explorer. You will need a Github account for that; if you don't have one, you need to create that first. Then, navigate to the [Graph Explorer](https://thegraph.com/explorer/), click on the `Sign up with Github` button and complete Github's authorization flow.

### Store the access token

After creating an account, navigate to your [dashboard](https://thegraph.com/explorer/dashboard). Copy the access token displayed on the dashboard then replace `<ACCESS_TOKEN>` in package.json `auth` script, finnally run:

```bash
$ yarn auth
```

You only need to do this once, or if you ever regenerate the access token.

*NOTE: In some systems this command will not work, skip to the next section and be sure to add `--access-token <ACCESS_TOKEN>` to the deploy script.*

### Create the subgraph

Before deploying the subgraph, create it in the Graph Explorer. Go to the [dashboard](https://thegraph.com/explorer/dashboard) and click on the `Add Subgraph` button. On the next screen, specify a name for the subgraph, and can also upload a custom image that will be displayed for your subgraph in the public Graph Explorer overview.

Note that it is currently not possible to change the subgraph name or image once it is created.

Update package.json `deploy` script to:
```
"deploy": "graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ GITHUB_USERNAME/SUBGRAPH_NAME --access-token <ACCESS_TOKEN>",
```

### Update the Key Management address

The subgraph will not include the Key Management node in the list of workers, if configured to do so. Edit `src/constants.ts` and add the *operating address* to the *keyManagementAddresses* array.

### Deploy the subgraph

Deploying your subgraph will upload the subgraph files that you've built with yarn build to IPFS and tell the Graph Explorer to start indexing your subgraph using these files:

```bash
yarn codegen
yarn deploy
```

After deploying the subgraph, the Graph Explorer will switch to showing the synchronization status of your subgraph. Depending on the amount of data and the number of events that need to be extracted from historical Ethereum blocks, starting with the genesis block, syncing can take from a few minutes to several hours. The subgraph status switches to Synced once the Graph Node has extracted all data from historical blocks. The Graph Node will continue inspecting Ethereum blocks for your subgraph as these blocks are mined.
