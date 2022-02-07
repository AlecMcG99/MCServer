# MCServer

The goal of this project is to create a minecraft and a hexxit 2 server using an ec2 instance in aws that I can start and stop using a discord bot.

I built out the infrastructure using the aws console in November but I'm rebuilding using aws-cdk so everything is more organized, I can make improvements easier, and I can show it on my github profile. 

# Project Flow

Here is how the application works: 

User uses start command on discord server -> Discord bot sends interaction to API Gateway -> API Gateway triggers Lambda Function -> Lambda Function determines which server to spin up based on the event sent to API Gateway -> Lambda Function spins up ec2 instance for the correct server-> ec2 Instance runs script when it boots up to start minecraft server -> EventBridge rule gets triggered by the ec2 instance starting up -> EventBridge rule assigns the elastic ip to the server that just booted up. 

# Development
The cdk app was written in typescript in a nodejs runtime environment.
