import { runCLI } from '@jest/core';
import { Document } from '@apidevtools/swagger-parser';
import type { Config } from '@jest/types';
import { Command, Flags, Args } from '@oclif/core';
import * as _ from 'lodash';
import * as commonFlags from '../../common/flags';
import * as path from 'path';
import d from 'debug';
import { getConfigValue } from '../../common/config';
import { TestConfig } from '../../tests/tests';
import { parseDefinition, resolveDefinition } from '../../common/definition';
const debug = d('cmd');

export class Test extends Command {
  public static description = 'Run automated tests against APIs';

  public static examples = [
    `$ openapi test`,
    `$ openapi test -o getPets`,
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.parseOpts(),
    operation: Flags.string({ char: 'o', description: 'filter by operationId', helpValue: 'operationId' }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'verbose mode',
      default: false,
    }),
  };

  public async run() {
    const { args, flags } = await this.parse(Test);

    const { dereference, validate, bundle, header } = flags;

    const definition = resolveDefinition(args.definition);
    if (!definition) {
      this.error('Please load a definition file', { exit: 1 });
    }

    let document: Document;
    try {
      document = await parseDefinition({
        definition,
        dereference,
        bundle,
        validate,
        servers: flags.server,
        inject: flags.inject,
        strip: flags.strip,
        header,
        induceServers: true,
      });
    } catch (err) {
      this.error(err, { exit: 1 });
    }

    const testConfig: TestConfig = getConfigValue('tests');

    if (!testConfig) {
      this.error('Please run `test add` first', { exit: 1 });
    }

    const argv: Config.Argv = {
      ...flags,
      $0: 'jest',
      _: [],
      passWithNoTests: true,
      verbose: true,
    }
    await runCLI(argv, [path.dirname(require.resolve('../../tests/run-jest'))]);
  }
}
