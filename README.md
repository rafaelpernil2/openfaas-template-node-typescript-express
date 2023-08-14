# node-typescript-express template for OpenFaaS

This template is based on the official `node14` template from OpenFaaS. It has been updated to Node 18.

It allows you to write your function in Typescript using Express. The main use case is GraphQL but it adapts to other use cases.

## Usage

```shell
faas-cli template pull https://github.com/rafaelpernil2/openfaas-template-node-typescript-express
faas-cli new my-typescript-function --lang node-typescript-express