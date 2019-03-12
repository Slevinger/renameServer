var cluster = require('cluster');
let redis = require('redis');
let rdsclient = redis.createClient(6379, 'tcp');

rdsclient.on('connect', function() {
    console.log('connected');
});
// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for terminating workers
    cluster.on('exit', function (worker) {

        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });

// Code to run if we're in a worker process
} else {
    let AWS = require('aws-sdk');
    let express = require('express');
    let bodyParser = require('body-parser');
    let keyGen = require('./keyGen');



    AWS.config.region = process.env.REGION

    let sns = new AWS.SNS();
    let ddb = new AWS.DynamoDB();

    let ddbTable =  process.env.STARTUP_SIGNUP_TABLE;
    let snsTopic =  process.env.NEW_SIGNUP_TOPIC;
    let port = 8080;

    let app = express();
// support CORS
    app.all('*', function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET ,POST , OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });

    app.use(bodyParser.json());

    const generator = new keyGen(rdsclient);

    let respondError = function (code, msg, res) {
        return res.status(code).json(msg);
    };

    app.get('/ref/:shortUrl', function (req,res) {
        return rdsclient.get(req.params.shortUrl,(err,result)=>{
            if (result){
                res.redirect(result);
            } else {
                return respondError(401,'no url listed',res);
            }
        })
    })

    app.post('/shortenUrl', function (req, res) {
        return generator.generateShortUrl(req,res);
    });

    app.post('/getUrl', function(req,res) {
        return generator.getUrlFromShrotUrl(req,res);
    })

    let server = app.listen(port, () => console.log(`Server running at http://127.0.0.1:${port} /'`));
}
