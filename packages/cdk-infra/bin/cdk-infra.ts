#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkInfraStack } from '../lib/cdk-infra-stack';

const app = new cdk.App();
new CdkInfraStack(app, 'MCServerStack', {
  env: { account: '532338652560', region: 'us-east-1' },
});