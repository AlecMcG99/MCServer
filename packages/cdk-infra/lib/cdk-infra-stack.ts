import { Stack, StackProps } from 'aws-cdk-lib';
import { Instance, InstanceType, MachineImage, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';


export class CdkInfraStack extends Stack {
  readonly vanillaServerEC2: Instance;
  readonly hexxitServerEC2: Instance;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const serverVpc = new Vpc(this, "serverVpc");

    this.vanillaServerEC2 = new Instance(this, "Minecraft Server", {
      instanceType: new InstanceType("t2.medium"),
      vpc: serverVpc,
      machineImage: MachineImage.latestAmazonLinux(), 
      securityGroup: SecurityGroup.fromLookupById(this, "mcSecurityGroup", 'sg-08aa5f2fb753f312c')
    });

    this.hexxitServerEC2 = new Instance(this, "Hexxit Server", {
      instanceType: new InstanceType("t3.medium"), 
      vpc: serverVpc,
      machineImage: MachineImage.latestAmazonLinux(), 
      securityGroup: SecurityGroup.fromLookupById(this, "mcSecurityGroup", 'sg-08aa5f2fb753f312c')
    });
  }
}
