#!/usr/bin/env -S npm exec --yes --package=zx@latest zx --
$.verbose = false

if (!argv._[0]) {
  argv._ = ['run'];
}

if (argv.help || argv._[0] === 'help') {
  argv._[0] === 'help' ? await help(...argv._slice(1)) : await help(...argv._)
} else if (argv._[0] === 'run') {
  await run(...argv._.slice(1));
} else if (argv._[0] === 'clean') {
  await clean(...argv._.slice(1));
} else {
  await help(...argv._);
}

async function help(args) {
  await echo`${chalk.yellow('Helping soon ?')}`;
}

async function run(args) {
  await echo`${__filename}`
}

async function clean(args) {
}
