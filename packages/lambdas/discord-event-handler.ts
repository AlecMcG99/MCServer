import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from "aws-lambda";
import * as AWS from "aws-sdk";
import { verifyKey } from "discord-interactions";

const ec2 = new AWS.EC2();

export interface Server {
    serverType: string,
    instanceId: string
};


export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
    console.log("received event: " + JSON.stringify(event, null, 2));
    try {
        if (!verify_signature(event)) {
            console.log("signature not verified");
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'signature not verified' }),
                headers: {
                    'Content-Type': 'application/json',
                }
            };
        }

        const eventBody = JSON.parse(event.body!);
        if (eventBody.type === 1) {
            return {
                statusCode: 200,
                body: JSON.stringify({ type: 1 }),
                headers: {
                    'Content-Type': 'application/json',
                }
            };
        }
        const command = eventBody.data;
        const server: Server = {
            serverType: command.options[0].value,
            instanceId: command.options[0] === 'Vanilla' ? process.env.VANILLA_INSTANCE_ID! : process.env.HEXXIT_INSTANCE_ID!
        }

        let response = { statusCode: 404, body: JSON.stringify({ type: 4, data: { content: command.name + "is not a valid command" } }) };

        if (command.name === "start") {
            response = await startServer(server);
        }
        else if (command.name === "stop") {
            response = await stopServer(server);
        }
        else if (command.name === "status") {
            response = await checkStatus(server);
        }

        console.log("response:" + JSON.stringify(response));
        return response;
    }
    catch (error) {
        console.error(error);
        const response = {
            statusCode: 500,
            body: JSON.stringify({ type: 4, data: { content: "lambda failed: " + error } }),
        };
        return response;
    }
};

async function startServer(server: Server) {
    try {
        const params = {
            InstanceIds: [server.instanceId],
        };
        console.log("starting " + server.serverType + " server");
        await ec2.startInstances(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({ type: 4, data: { content: server.serverType + " server started successfully!" } }),
            headers: {
                'Content-Type': 'application/json',
            }
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ text: 'error starting server' + error }),
            headers: {
                'Content-Type': 'application/json',
            }
        };
    }

}

async function stopServer(server: Server) {
    try {
        const params = {
            InstanceIds: [server.instanceId]
        };
        console.log("Stopping " + server.serverType + " server")
        await ec2.stopInstances(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({ type: 4, data: { content: server.serverType + " server stopped successfully!" } }),
            headers: {
                'Content-Type': 'application/json',
            }
        }
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'error stopping server' }),
            headers: {
                'Content-Type': 'application/json',
            }
        }
    }

}

async function checkStatus(server: Server) {
    try {
        const params = { InstanceIds: [server.instanceId] }
        console.log("checking server status")
        const state = await ec2.describeInstances(params).promise()
        console.log("State:" + JSON.stringify(state))
        return {
            statusCode: 200,
            body: JSON.stringify({ type: 4, data: { content: "state: " + state } }),
            headers: {
                'Content-Type': 'application/json',
            }
        }

    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'error checking server status' }),
            headers: {
                'Content-Type': 'application/json',
            }
        }
    }
}

function verify_signature(event: APIGatewayProxyEvent) {
    const signature = event.headers['x-signature-ed25519'];
    const timestamp = event.headers['x-signature-timestamp'];
    const body = event.body
    const verified = verifyKey(body!, signature!, timestamp!, process.env.DISCORD_PUBLIC_KEY!)
    if (verified) { console.log("Signature Verified!") };
    return verified
}
