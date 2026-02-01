#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { addUsage, getUsage, getStats, clearUsage } from './db';
import { calculateCost } from './pricing';
import { displayUsageTable, displayStats, displaySummary } from './formatters';
import { Provider } from './types';
import { subDays, startOfDay } from 'date-fns';

const program = new Command();

program
  .name('token-tracker')
  .description('Track AI API usage and costs across multiple providers')
  .version('1.0.0');

// Add command
program
  .command('add')
  .description('Add a new usage entry')
  .requiredOption('-p, --provider <provider>', 'Provider (openai, anthropic, google, azure, cohere)')
  .requiredOption('-m, --model <model>', 'Model name')
  .requiredOption('-i, --input <tokens>', 'Input/prompt tokens', parseInt)
  .requiredOption('-o, --output <tokens>', 'Output/completion tokens', parseInt)
  .option('-n, --notes <notes>', 'Additional notes')
  .action((options) => {
    const spinner = ora('Adding usage...').start();

    try {
      const totalTokens = options.input + options.output;
      const cost = calculateCost(options.provider, options.model, options.input, options.output);

      const id = addUsage({
        provider: options.provider as Provider,
        model: options.model,
        promptTokens: options.input,
        completionTokens: options.output,
        totalTokens,
        cost,
        timestamp: new Date().toISOString(),
        notes: options.notes,
      });

      spinner.succeed(
        chalk.green(
          `Added usage #${id} - ${options.provider}/${options.model} - ${chalk.yellow(`$${cost.toFixed(4)}`)}`
        )
      );
    } catch (error: any) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .alias('ls')
  .description('List usage entries')
  .option('-p, --provider <provider>', 'Filter by provider')
  .option('-l, --limit <number>', 'Limit number of results', parseInt, 20)
  .option('--json', 'Output as JSON')
  .action((options) => {
    try {
      const usage = getUsage({
        provider: options.provider,
        limit: options.limit,
      });

      if (options.json) {
        console.log(JSON.stringify(usage, null, 2));
      } else {
        displayUsageTable(usage);
        const stats = getStats({ provider: options.provider });
        displaySummary(stats);
      }
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show usage statistics')
  .option('-p, --provider <provider>', 'Filter by provider')
  .option('-d, --days <number>', 'Filter by last N days', parseInt)
  .option('--json', 'Output as JSON')
  .action((options) => {
    try {
      const filters: any = {};

      if (options.provider) {
        filters.provider = options.provider;
      }

      if (options.days) {
        filters.startDate = subDays(new Date(), options.days).toISOString();
      }

      const stats = getStats(filters);

      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        displayStats(stats);
      }
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Today command
program
  .command('today')
  .description('Show today\'s usage')
  .option('--json', 'Output as JSON')
  .action((options) => {
    try {
      const usage = getUsage({
        startDate: startOfDay(new Date()).toISOString(),
      });

      if (options.json) {
        console.log(JSON.stringify(usage, null, 2));
      } else {
        if (usage.length === 0) {
          console.log(chalk.yellow('\n📭 No usage today yet.\n'));
        } else {
          console.log(chalk.bold.cyan('\n📅 Today\'s Usage\n'));
          displayUsageTable(usage);
          const stats = getStats({ startDate: startOfDay(new Date()).toISOString() });
          displaySummary(stats);
        }
      }
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Clear command
program
  .command('clear')
  .description('Clear usage data')
  .option('-p, --provider <provider>', 'Clear only specific provider')
  .option('--before <date>', 'Clear entries before date (ISO format)')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (options) => {
    if (!options.yes) {
      console.log(chalk.yellow('\n⚠️  Warning: This will permanently delete usage data.\n'));
      console.log('Run with --yes to confirm.\n');
      return;
    }

    const spinner = ora('Clearing usage data...').start();

    try {
      const deleted = clearUsage({
        provider: options.provider,
        before: options.before,
      });

      spinner.succeed(chalk.green(`Deleted ${deleted} entries`));
    } catch (error: any) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Models command
program
  .command('models')
  .description('List supported models and pricing')
  .option('-p, --provider <provider>', 'Filter by provider')
  .action((options) => {
    const { pricing } = require('./pricing');

    const providers = options.provider
      ? [options.provider]
      : Object.keys(pricing);

    console.log(chalk.bold.cyan('\n💰 Supported Models & Pricing\n'));

    for (const provider of providers) {
      const models = pricing[provider]?.models;
      if (!models) {
        console.log(chalk.yellow(`Provider "${provider}" not found.\n`));
        continue;
      }

      console.log(chalk.bold.green(`\n${provider.toUpperCase()}\n`));

      const Table = require('cli-table3');
      const table = new Table({
        head: [
          chalk.cyan.bold('Model'),
          chalk.cyan.bold('Input (per 1M)'),
          chalk.cyan.bold('Output (per 1M)'),
        ],
        style: { head: [], border: [] },
      });

      for (const [model, prices] of Object.entries(models)) {
        const p = prices as { input: number; output: number };
        table.push([
          chalk.white(model),
          chalk.yellow(`$${p.input.toFixed(2)}`),
          chalk.yellow(`$${p.output.toFixed(2)}`),
        ]);
      }

      console.log(table.toString());
    }

    console.log();
  });

program.parse();
