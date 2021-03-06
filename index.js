const express = require('express'); //To create a server
const bodyParser = require('body-parser'); //To parse incomming request bodies
const request = require('request-promise');//To make HTTP calls to the Root API

const ROOT_API_ENDPOINT = 'https://sandbox.root.co.za/v1/insurance';
const CLIENT_ID = '137b9616-10f7-11e8-bd8b-dfc98f78ba4e';//TODO: Insert your Root Client ID here
const CLIENT_SECRET = '3cRCQ4Bp8ti98GrdN96V0IBqrrHHpggp';////TODO: Insert your Root Client Secret here
const AUTH_TOKEN = "Basic " + new Buffer(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64");

//Create an express server and define a parsing strategy on it. 
const server = express();
server.use(bodyParser.urlencoded({
    //Use deep parsing to deal with nested objects
    extended: true
}));

//Specify the use of json
server.use(bodyParser.json());

//REST Endpoint for getting a root_gadget insurance quote
server.post('/get-insurance-quote', function(req, res) {

    //Extract the device name from the request object
    let device = req.body.result && req.body.result.parameters && req.body.result.parameters.device ? req.body.result.parameters.device : null;
    console.log(device);
    
    if (device != null) {
        let reqUrl = encodeURI(ROOT_API_ENDPOINT + '/quotes');

        const options = {
            method: 'POST',
            headers: {
                username: CLIENT_ID,
                password: CLIENT_SECRET,
                authorization: AUTH_TOKEN
            },
            uri: reqUrl,
            form: {
                type: 'root_gadgets',
                model_name: device
            },
            json: true
        }

        request(options, function(error, response, body) {
            if (error) {
                res.send(error);
            }

            //Extract quotes from response
            let comprehensive_insurance_quote = body[0];
            let theft_insurance_quote = body[1];

            if (comprehensive_insurance_quote === undefined) {
                //Send error result back to DialogFlow if device not found
                var errorMessage = "I cannot seem to find any information on file for your device. I will give you a call shortly to resolve this";
                return res.json({
                    speech: errorMessage,
                    displayText: errorMessage,
                    source: 'get-insurance-quote'
                });
            }

            //Send comprehenisive insurance amount back to DialogFlow (Using suggested_premium value)
            var responseMessage = "Comprehensive insurance of your device will cost R" + comprehensive_insurance_quote.suggested_premium / 100.0 + " per month";
            return res.json({
                speech: responseMessage,
                displayText: responseMessage,
                source: 'get-insurance-quote'
            });
        });
    }
});

server.listen(3000, () => console.log('Listening on port 3000'));

