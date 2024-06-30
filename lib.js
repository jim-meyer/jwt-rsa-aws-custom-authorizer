require('dotenv').config({ silent: true });

const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const util = require('util');

const getPolicyDocument = (effect, resource) => {
    const policyDocument = {
        Version: '2012-10-17', // default version
        Statement: [{
            Action: 'execute-api:Invoke', // default action
            Effect: effect,
            // Restricting to the method ARN (`resource`) doesn't play nice with API Gateway's custom authorizer
            // caching. Problem is that request for Resource1 gets cached and then when request for Resource2 comes
            // in the cache may be used. But if we use `resource` here it only applies to Resource1 and thus
            // Resource2 fails authorization.
            // see https://stackoverflow.com/a/56119016
            Resource: '*',
            // Resource: resource,
        }]
    };
    return policyDocument;
}


// extract and return the Bearer Token from the Lambda event parameters
const getToken = (event) => {
    if (!event.type || event.type !== 'TOKEN') {
        throw new Error('Expected "event.type" parameter to have value "TOKEN"');
    }

    const tokenString = event.authorizationToken;
    if (!tokenString) {
        throw new Error('Expected "event.authorizationToken" parameter to be set');
    }

    const match = tokenString.match(/^Bearer (.*)$/);
    if (!match || match.length < 2) {
        throw new Error(`Invalid Authorization token - ${tokenString} does not match "Bearer .*"`);
    }
    return match[1];
}

const jwtOptions = {
    audience: process.env.AUDIENCE,
    issuer: process.env.TOKEN_ISSUER
};

module.exports.authenticateToken = (token, methodArn) => {
    // console.log('*** authenticateToken(): audience=', jwtOptions.audience);
    // console.log('*** authenticateToken(): issuer=', jwtOptions.issuer);
    const decoded = jwt.decode(token, { complete: true });
    // console.log('*** decoded: ', JSON.stringify(decoded));
    if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new Error('invalid token');
    }

    const getSigningKey = util.promisify(client.getSigningKey);
    return getSigningKey(decoded.header.kid)
        .then((key) => {
            const signingKey = key.publicKey || key.rsaPublicKey;
            return jwt.verify(token, signingKey, jwtOptions);
        })
        .then((decoded)=> {
            // console.log('*** decoded: ', JSON.stringify(decoded));
            const result = {
                principalId: decoded.sub,
                policyDocument: getPolicyDocument('Allow', methodArn),
                context: { scope: decoded.scope, sub: decoded.sub, email: decoded['https://buckfinderapp.com/claims/email'] }
            };
            return result;
        });
};

module.exports.authenticate = async (event) => {
    // console.log(event);
    const token = getToken(event);
    const result = await module.exports.authenticateToken(token, event.methodArn);
    // console.log('*** result: ', JSON.stringify(result));
    return result;
};

 const client = jwksClient({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 100, // Default value
        jwksUri: process.env.JWKS_URI
  });
