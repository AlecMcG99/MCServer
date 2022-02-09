import { Stack, StackProps } from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Instance, InstanceType, MachineImage, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';


export class CdkInfraStack extends Stack {
  readonly vanillaServerEC2: Instance;
  readonly hexxitServerEC2: Instance;
  readonly discordEventHandler: Function;
  readonly serverApi: LambdaRestApi

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const serverVpc = Vpc.fromLookup(this, 'mcVPC', {
      vpcId: 'vpc-065e74560509b0075'
    });
    const mcSecurityGroup = SecurityGroup.fromSecurityGroupId(this, 'mcSecurityGroup', 'sg-08aa5f2fb753f312c');

    this.vanillaServerEC2 = new Instance(this, "minecraft-server", {
      instanceType: new InstanceType("t2.medium"),
      vpc: serverVpc,
      machineImage: MachineImage.latestAmazonLinux(),
      securityGroup: mcSecurityGroup
    });

    this.hexxitServerEC2 = new Instance(this, "hexxit-server", {
      instanceType: new InstanceType("t3.medium"),
      vpc: serverVpc,
      machineImage: MachineImage.latestAmazonLinux(),
      securityGroup: mcSecurityGroup
    });

    this.discordEventHandler = new NodejsFunction(this, 'discord-event-handler-lambda', {
      functionName: 'discord-event-handler',
      entry: '../lambdas/discord-event-handler.ts',
      runtime: Runtime.NODEJS_14_X,
      environment: {
        DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY!,
        VANILLA_INSTANCE_ID: this.vanillaServerEC2.instanceId,
        HEXXIT_INSTANCE_ID: this.hexxitServerEC2.instanceId
      }
    })

    this.discordEventHandler.addToRolePolicy(new PolicyStatement({
      actions: ["ec2:*"],
      effect: Effect.ALLOW,
      resources: ["*"]
    }));

    this.serverApi = new LambdaRestApi(this, 'server-api', {
      handler: this.discordEventHandler,
      restApiName: 'server-api', 
      proxy: false
    });

    this.serverApi.root.addResource('discord-event').addMethod('POST', undefined, {
      methodResponses: [
        { statusCode: "200" },
        { statusCode: "401" },
        { statusCode: "404" },
        { statusCode: "500" }
      ]
    });
  }
}