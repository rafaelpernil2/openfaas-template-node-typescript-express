async function handle(event: any, context: any, cb: any){
  const result = {
    'body': JSON.stringify(event.body),
    'content-type': event.headers["content-type"]
  }
  context
  .status(200)
  return context.succeed(result)
}

export { handle };
