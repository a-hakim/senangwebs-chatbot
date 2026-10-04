// Packaging/integration check; does not execute the unit suite.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const esbuild = require('esbuild');
const vm = require('node:vm');
const webpack = require('webpack');
const { createHash } = require('node:crypto');
async function main() {
  const expected = ['swc.css', 'swc.js', 'swc.min.css', 'swc.min.js'];
  const actual = fs.readdirSync('dist').sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('dist must contain exactly the four distributable assets');
  for (const bundle of ['swc.js', 'swc.min.js']) {
    const exports = require(`../dist/${bundle}`);
    for (const name of ['initializeChatbot', 'SenangWebsChatbot', 'OpenRouterAPI', 'ContextManager']) if (typeof exports[name] !== 'function') throw new Error(`Missing ${bundle} package export: ${name}`);
    if (!Array.isArray(exports.defaultKnowledgeBase)) throw new Error(`Missing ${bundle} knowledge base export`);
  }
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'swc-package-'));
  const configs = require('../webpack.config.js').map(config => ({ ...config, output: { ...config.output, path: output } }));
  await new Promise((resolve, reject) => webpack(configs, (error, stats) => {
    if (error) { reject(error); return; }
    if (stats.hasErrors() || stats.hasWarnings()) { reject(new Error(stats.toString({ all: false, errors: true, warnings: true }))); return; }
    resolve();
  }));
  const hash = filename => createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
  for (const name of expected) if (hash(path.join(output, name)) !== hash(path.join('dist', name))) throw new Error(`Source/distribution mismatch: ${name}`);
  await esbuild.build({ entryPoints: ['tests/fixtures/npm-import.mjs'], bundle: true, platform: 'browser', format: 'iife', outfile: path.join(output, 'fixture.js') });
  const consumer = { console };
  vm.runInNewContext(fs.readFileSync(path.join(output, 'fixture.js'), 'utf8'), consumer);
  for (const name of ['SenangWebsChatbot', 'initializeChatbot', 'OpenRouterAPI', 'ContextManager']) if (typeof consumer.SWCImport[name] !== 'function') throw new Error(`Bundled npm import missing ${name}`);
  const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), process.platform === 'win32' ? 'node_modules/npm/bin/npm-cli.js' : '../lib/node_modules/npm/bin/npm-cli.js');
  const pack = JSON.parse(execFileSync(process.execPath, [npmCli, 'pack', '--dry-run', '--ignore-scripts', '--json', '--cache', path.join(os.tmpdir(), 'swc-package-npm-cache')], { encoding: 'utf8' }))[0];
  for (const name of expected) if (!pack.files.some(file => file.path === `dist/${name}`)) throw new Error(`Package omits ${name}`);
  if (!pack.files.some(file => file.path === 'THIRD_PARTY_LICENSES.md')) throw new Error('Package omits bundled dependency license');
  console.log(JSON.stringify({ package: `${pack.name}@${pack.version}`, bytes: pack.size, files: pack.entryCount, sourceDistributionParity: true, bundledImportFixture: output }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
