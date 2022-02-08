const AWS = require("aws-sdk");
const { verifyKey } = require('discord-interactions');
var ec2 = new AWS.EC2();

let serverType;
let ec2_instance_id;

exports.handler = async(event) => {
    console.log("received event: " + JSON.stringify(event, null, 2));
    try {
        if (!verify_signature(event)) {
            console.log("signature not verified");
            return {
                statusCode: '401',
                body: JSON.stringify({ error: 'signature not verified' }),
                headers: {
                    'Content-Type': 'application/json',
                }
            };
        }
        const body = JSON.parse(event.body);
        if (body.type === 1) {
            return {
                statusCode: '200',
                body: JSON.stringify({ type: 1 }),
                headers: {
                    'Content-Type': 'application/json',
                }
            };
        }
        const command = body.data.name;
        serverType = body.data.options[0].value;
        ec2_instance_id = serverType === 'Vanilla' ? [process.env.VANILLA_INSTANCE_ID] : [process.env.HEXXIT_INSTANCE_ID]

        let response = { statusCode: '404', body: JSON.stringify({ type: 4, data: { content: command + "is not a valid command" } }) };

        if (command === "start") {
            response = startServer();
        }
        else if (command === "stop") {
            response = stopServer();
        }
        else if (command === "status") {
            response = await checkStatus();
        }

        console.log("response:" + JSON.stringify(response));
        return response;
    }
    catch (error) {
        console.error(error);
        const response = {
            statusCode: '500',
            body: JSON.stringify({ type: 4, data: { content: "lambda failed: " + error } }),
        };
        return response;
    }
};

async function startServer() {
    try {
        var params = {
            InstanceIds: ec2_instance_id,
        };
        console.log("starting " + serverType + " server");
        await ec2.startInstances(params).promise();
        return {
            statusCode: '200',
            body: JSON.stringify({ type: 4, data: { content: serverType + " server started successfully!" } }),
            headers: {
                'Content-Type': 'application/json',
            }
        };
    }
    catch (error) {
        return {
            statusCode: '500',
            body: JSON.stringify({ text: 'error starting server' + error }),
            headers: {
                'Content-Type': 'application/json',
            }
        };
    }

}

async function stopServer() {
    try {
        var params = {
            InstanceIds: ec2_instance_id,
        };
        console.log("Stopping " + serverType + " server")
        await ec2.stopInstances(params).promise();
        return {
            statusCode: '200',
            body: JSON.stringify({ type: 4, data: { content: serverType + " server stopped successfully!" } }),
            headers: {
                'Content-Type': 'application/json',
            }
        }
    }
    catch (error) {
        return {
            statusCode: '500',
            body: JSON.stringify({ error: 'error stopping server' }),
            headers: {
                'Content-Type': 'application/json',
            }
        }
    }

}

function checkStatus() {
    try {
        var params = { InstanceIds: ec2_instance_id, }
        console.log("checking server status")
        const state = ec2.describeInstances(params, function(err, data) {
            if (err) {
                console.log("Error", err.stack);
            }
            else {
                return data;
            }
        })
        console.log("State:" + JSON.stringify(state))
        return {
            statusCode: '200',
            body: JSON.stringify({ type: 4, data: { content: "status checked" } }),
            headers: {
                'Content-Type': 'application/json',
            }
        }

    }
    catch (error) {
        return {
            statusCode: '500',
            body: JSON.stringify({ error: 'error checking server status' }),
            headers: {
                'Content-Type': 'application/json',
            }
        }
    }
}

function verify_signature(event) {
    const signature = event.headers['x-signature-ed25519'];
    const timestamp = event.headers['x-signature-timestamp'];
    const body = event.body
    const verified = verifyKey(body, signature, timestamp, process.env.DISCORD_PUBLIC_KEY)
    if (verified) { console.log("Signature Verified!") };
    return verified
}
