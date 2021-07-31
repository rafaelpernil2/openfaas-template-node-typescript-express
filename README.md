# node-typescript-express-websockets template for OpenFaaS

This template is based on the official `node14` template from OpenFaaS. 

It allows you to write your function in Typescript using Express and Websockets. The main use case is GraphQL but it adapts to other use cases.

## Usage

```shell
faas-cli template pull https://github.com/rafaelpernil2/openfaas-template-node-typescript-express-websockets
faas-cli new my-typescript-function --lang node-typescript-express-websockets