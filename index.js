const lib = require('./lib');
let data;

// Lambda function index.handler - thin wrapper around lib.authenticate
/*
:param event: Example:
{
  type: 'TOKEN',
  methodArn: 'arn:aws:execute-api:us-east-2:081882337585:cyqelo2s44/sandbox/GET/notification',
  authorizationToken: 'Bearer eyJh...'
}
:param context: Example:
    context= {
      callbackWaitsForEmptyEventLoop: [Getter/Setter],
      succeed: [Function (anonymous)],
      fail: [Function (anonymous)],
      done: [Function (anonymous)],
      functionVersion: '$LATEST',
      functionName: 'bf-sam-app-Auth0AuthorizerLambda-SdNP0p446hYc',
      memoryLimitInMB: '128',
      logGroupName: '/aws/lambda/bf-sam-app-Auth0AuthorizerLambda-SdNP0p446hYc',
      logStreamName: '2023/11/14/[$LATEST]969d35d7290d4c199ace86311c742a38',
      clientContext: undefined,
      identity: undefined,
      invokedFunctionArn: 'arn:aws:lambda:us-east-2:081882337585:function:bf-sam-app-Auth0AuthorizerLambda-SdNP0p446hYc',
      awsRequestId: '14055ac9-77e1-47ca-9a67-73ec5010ef4b',
      getRemainingTimeInMillis: [Function: getRemainingTimeInMillis]
    }
*/
module.exports.handler = async (event, context, callback) => {
  try {
    // console.log('*** authorization lambda handler: event=', event);
    // console.log('*** authorization lambda handler: context=', context);
    data = await lib.authenticate(event);
  }
  catch (err) {
      console.log(err);
      // https://stackoverflow.com/questions/71965522/how-to-return-401-response-in-aws-api-gateway-lambda-authorizer pointed me to:
      //    https://github.com/awslabs/aws-apigateway-lambda-authorizer-blueprints/blob/1e79ad02a4dcbbd0fe2951cf9a5de4aff7915823/blueprints/python/api-gateway-authorizer-python.py#L28
      // After many hours searching for this in AWS docs to find such a subtle but important blurb squirreled away where it is
      // impossible to find?! %*#&^ AWS and their *!&% docs.
      throw new Error('Unauthorized');

      // return context.fail("Unauthorized");

      // Added this based on some articles (didn't save link... grr) but API Gateway was still returning 403, not 401 with these changes
      // const result = {
      //   statusCode: 401,
      //   headers: {
      //     'X-Amz-Function-Error': 401,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ statusCode: 401, message: 'Unauthorized -\_/-' }),
      // };
      // context.succeed(result);
  }
  return data;
};
