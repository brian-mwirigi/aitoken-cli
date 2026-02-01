import chalk from 'chalk';
import Table from 'cli-table3';
import { Usage, Stats } from './types';
import { format } from 'date-fns';

export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
}

export function displayUsageTable(usage: Usage[], showNotes = false): void {
  if (usage.length === 0) {
    console.log(chalk.yellow('No usage data found.'));
    return;
  }

  const headers = ['Date', 'Provider', 'Model', 'Tokens', 'Cost'];
  if (showNotes) headers.push('Notes');

  const table = new Table({
    head: headers.map((h) => chalk.cyan.bold(h)),
    style: { head: [], border: [] },
  });

  for (const u of usage) {
    const row: string[] = [
      formatDate(u.timestamp),
      chalk.green(u.provider),
      u.model,
      formatTokens(u.totalTokens),
      chalk.yellow(formatCost(u.cost)),
    ];
    if (showNotes) row.push(u.notes || '-');
    table.push(row);
  }

  console.log(table.toString());
}

export function displayStats(stats: Stats): void {
  console.log(chalk.bold.cyan('\n📊 Overall Stats\n'));

  const overallTable = new Table({
    head: [chalk.cyan.bold('Metric'), chalk.cyan.bold('Value')],
    style: { head: [], border: [] },
  });

  overallTable.push(
    ['Total Requests', chalk.white(stats.totalRequests.toLocaleString())],
    ['Total Tokens', chalk.white(formatTokens(stats.totalTokens))],
    ['Total Cost', chalk.yellow.bold(formatCost(stats.totalCost))]
  );

  console.log(overallTable.toString());

  // By Provider
  if (Object.keys(stats.byProvider).length > 0) {
    console.log(chalk.bold.cyan('\n📦 By Provider\n'));

    const providerTable = new Table({
      head: [
        chalk.cyan.bold('Provider'),
        chalk.cyan.bold('Requests'),
        chalk.cyan.bold('Tokens'),
        chalk.cyan.bold('Cost'),
        chalk.cyan.bold('% of Total'),
      ],
      style: { head: [], border: [] },
    });

    const sortedProviders = Object.entries(stats.byProvider).sort(
      ([, a], [, b]) => b.cost - a.cost
    );

    for (const [provider, data] of sortedProviders) {
      const percentage = ((data.cost / stats.totalCost) * 100).toFixed(1);
      providerTable.push([
        chalk.green(provider),
        data.requests.toLocaleString(),
        formatTokens(data.tokens),
        chalk.yellow(formatCost(data.cost)),
        chalk.gray(`${percentage}%`),
      ]);
    }

    console.log(providerTable.toString());
  }

  // By Model
  if (Object.keys(stats.byModel).length > 0) {
    console.log(chalk.bold.cyan('\n🤖 Top Models\n'));

    const modelTable = new Table({
      head: [
        chalk.cyan.bold('Model'),
        chalk.cyan.bold('Requests'),
        chalk.cyan.bold('Tokens'),
        chalk.cyan.bold('Cost'),
      ],
      style: { head: [], border: [] },
    });

    const sortedModels = Object.entries(stats.byModel)
      .sort(([, a], [, b]) => b.cost - a.cost)
      .slice(0, 10);

    for (const [model, data] of sortedModels) {
      modelTable.push([
        chalk.white(model),
        data.requests.toLocaleString(),
        formatTokens(data.tokens),
        chalk.yellow(formatCost(data.cost)),
      ]);
    }

    console.log(modelTable.toString());
  }

  console.log();
}

export function displaySummary(stats: Stats): void {
  console.log(
    chalk.bold(`\n💰 Total: ${chalk.yellow(formatCost(stats.totalCost))} `) +
      chalk.gray(`| ${formatTokens(stats.totalTokens)} tokens | ${stats.totalRequests} requests\n`)
  );
}
