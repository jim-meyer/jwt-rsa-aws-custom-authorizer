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
            Resource: resource,
        }]
    };
    return policyDocument;
}


// extract and return the Bearer Token from the Lambda event parameters
const getToken = (params) => {
    if (!params.type || params.type !== 'TOKEN') {
        throw new Error('Expected "event.type" parameter to have value "TOKEN"');
    }

    const tokenString = params.authorizationToken;
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
    console.log('*** token: ' + token);
    const decoded = jwt.decode(token, { complete: true });
    console.log('*** decoded: ', JSON.stringify(decoded));
    if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new Error('invalid token');
    }

    const getSigningKey = util.promisify(client.getSigningKey);
    console.log('*** returning');
    return getSigningKey(decoded.header.kid)
        .then((key) => {
            const signingKey = key.publicKey || key.rsaPublicKey;
            return jwt.verify(token, signingKey, jwtOptions);
        })
        .then((decoded)=> {
            const result = {
                principalId: decoded.sub,
                policyDocument: getPolicyDocument('Allow', methodArn),
                context: { scope: decoded.scope, sub: decoded.sub, email: decoded.email }
            };
            console.log('*** result: ', JSON.stringify(result));
            return result;
        });
};

module.exports.authenticate = (params) => {
    console.log(params);
    const token = getToken(params, params.methodArn);
    return module.exports.authenticateToken(token);
};

 const client = jwksClient({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 100, // Default value
        jwksUri: process.env.JWKS_URI
  });
