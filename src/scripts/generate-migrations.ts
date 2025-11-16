#!/usr/bin/env ts-node
import path from 'path';
import fs from 'fs';
import { Sequelize } from 'sequelize-typescript';

// Load sequelize config
const configPath = path.resolve(__dirname, '..', '..', 'config', 'config.js');
const config = require(configPath);
const env = process.env.NODE_ENV || 'development';
const cfg = config[env] || config.development;

// Build Sequelize options
const sequelizeOptions: any = {
  dialect: cfg.dialect || 'postgres',
  logging: false,
};
if (cfg.use_env_variable) {
  sequelizeOptions.url = process.env[cfg.use_env_variable] || process.env.DATABASE_URL;
} else if (process.env.DATABASE_URL && !cfg.use_env_variable) {
  sequelizeOptions.url = process.env.DATABASE_URL;
} else {
  sequelizeOptions.host = cfg.host;
  sequelizeOptions.port = cfg.port;
  sequelizeOptions.username = cfg.username;
  sequelizeOptions.password = cfg.password;
  sequelizeOptions.database = cfg.database;
}

// Create Sequelize instance (we won't connect to DB for generation)
const sequelize = new Sequelize({ ...sequelizeOptions, models: [] } as any);

// Add models by importing files and collecting exported Model classes.
const entitiesDir = path.resolve(__dirname, '..', '..', 'src', 'entities');
const catalogModelsDir = path.resolve(__dirname, '..', '..', 'src', 'catalog', 'models');
const modelDirs = [] as string[];
if (fs.existsSync(entitiesDir)) modelDirs.push(entitiesDir);
if (fs.existsSync(catalogModelsDir)) modelDirs.push(catalogModelsDir);
if (modelDirs.length === 0) {
  console.error('No model directories found to load. Checked:', entitiesDir, catalogModelsDir);
  process.exit(1);
}

// Helper: load all .ts/.js files in a dir and collect exported classes that extend Model
import { Model } from 'sequelize-typescript';
function loadModelsFromDir(dir: string) {
  const models: any[] = [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));
  for (const file of files) {
    // skip d.ts and spec files
    if (file.endsWith('.d.ts') || file.endsWith('.spec.ts') || file.endsWith('.spec.js')) continue;
    const full = path.join(dir, file);
    try {
      const mod = require(full);
      // collect default export and named exports
      const exportsToCheck = [] as any[];
      if (mod.default) exportsToCheck.push(mod.default);
      for (const k of Object.keys(mod)) exportsToCheck.push(mod[k]);
      for (const exp of exportsToCheck) {
        if (typeof exp === 'function') {
          // check prototype chain
          if (exp.prototype instanceof Model || exp.prototype instanceof (Model as any)) {
            models.push(exp);
          }
        }
      }
    } catch (err) {
      // ignore individual file failures but log lightly
      console.warn('Failed loading model file', full, err && err.message ? err.message : err);
    }
  }
  return models;
}

const collectedModels: any[] = [];
for (const d of modelDirs) {
  const ms = loadModelsFromDir(d);
  collectedModels.push(...ms);
}
if (collectedModels.length === 0) {
  console.error('No model classes discovered in:', modelDirs.join(', '));
  process.exit(1);
}

sequelize.addModels(collectedModels);

function mapDataType(type: any): string {
  // handle common sequelize-types
  if (!type) return 'Sequelize.STRING';
  const ctor = type.constructor && (type.constructor.name || type.constructor.key);
  const key = ctor || String(type);
  const t = key.toString().toLowerCase();
  if (t.includes('string')) return 'Sequelize.STRING';
  if (t.includes('text')) return 'Sequelize.TEXT';
  if (t.includes('integer')) return 'Sequelize.INTEGER';
  if (t.includes('bigint')) return 'Sequelize.BIGINT';
  if (t.includes('float')) return 'Sequelize.FLOAT';
  if (t.includes('boolean')) return 'Sequelize.BOOLEAN';
  if (t.includes('date')) return 'Sequelize.DATE';
  if (t.includes('uuid')) return 'Sequelize.UUID';
  if (t.includes('json')) return 'Sequelize.JSONB';
  if (t.includes('array')) {
    // try to inspect underlying type
    const subtype = type.type || type.options?.type || null;
    const sub = mapDataType(subtype);
    return `Sequelize.ARRAY(${sub})`;
  }
  return 'Sequelize.STRING';
}

function serializeDefault(val: any): string | undefined {
  if (val === undefined) return undefined;
  if (val === null) return 'null';
  if (typeof val === 'number' || typeof val === 'boolean') return JSON.stringify(val);
  if (typeof val === 'string') return JSON.stringify(val);
  if (val && typeof val === 'object' && val.toString && val.toString().includes('NOW')) return 'Sequelize.literal(\"now()\")';
  return undefined;
}

function buildColumnDef(attr: any): string {
  const parts: string[] = [];
  const typeCode = mapDataType(attr.type);
  parts.push(`type: ${typeCode}`);
  if (attr.allowNull === false) parts.push('allowNull: false');
  if (attr.primaryKey) parts.push('primaryKey: true');
  if (attr.unique) parts.push('unique: true');
  const dv = serializeDefault(attr.defaultValue);
  if (dv !== undefined) parts.push(`defaultValue: ${dv}`);
  return `{ ${parts.join(', ')} }`;
}

function toMigration(tableName: string, attributes: any): string {
  const cols: string[] = [];
  for (const k of Object.keys(attributes)) {
    const a = attributes[k];
    cols.push(`      \"${k}\": ${buildColumnDef(a)}`);
  }
  const up = `await queryInterface.createTable(\"${tableName}\", {
${cols.join(',\n')}
    });`;
  const down = `await queryInterface.dropTable(\"${tableName}\");`;
  return `"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    ${up}
  },

  async down(queryInterface) {
    ${down}
  }
};
`;
}

// Ensure output dir
const outDir = path.resolve(__dirname, '..', '..', 'migrations_generated');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const createdFiles: string[] = [];
async function run() {
  for (const name of Object.keys((sequelize as any).models)) {
    const model = (sequelize as any).models[name];
    const tableName = model.getTableName ? (typeof model.getTableName === 'function' ? model.getTableName() : model.tableName) : model.tableName || name;
    const attrs = model.rawAttributes || model.prototype?.rawAttributes || {};
    // Check for existing migration for this table in migrations_generated/ or migrations/
    const migrationsDir = path.resolve(__dirname, '..', '..', 'migrations');
    function migrationExistsForTable(tbl: string) {
      const candidates: string[] = [];
      if (fs.existsSync(outDir)) candidates.push(...fs.readdirSync(outDir).map((f) => path.join(outDir, f)));
      if (fs.existsSync(migrationsDir)) candidates.push(...fs.readdirSync(migrationsDir).map((f) => path.join(migrationsDir, f)));
      // escape table name for use in regex
      const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedTbl = escapeRegExp(String(tbl));
      const tablePattern = new RegExp(`createTable\\s*\\(\\s*['\"\\\`]${escapedTbl}['\"\\\`]`, 'i');
      const sanitized = String(tbl).replace(/[^a-z0-9_]/gi, '_').toLowerCase();
      const fileNamePattern = new RegExp(`-${escapeRegExp(sanitized)}-create`, 'i');
      for (const c of candidates) {
        try {
          const content = fs.readFileSync(c, 'utf8');
          if (tablePattern.test(content)) return true;
          const base = path.basename(c).toLowerCase();
          if (fileNamePattern.test(base) || base.includes(`${sanitized}-create`)) return true;
        } catch (e) {
          // ignore unreadable files
        }
      }
      return false;
    }

    if (migrationExistsForTable(String(tableName))) {
      // skip generating migration for this table to avoid duplicates
      continue;
    }

    // collect attributes and write a migration file
    const migrationCode = toMigration(tableName, attrs);
    const ts = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const fileName = `${ts}-${String(tableName).replace(/[^a-z0-9_]/gi, '_')}-create.js`;
    const outPath = path.join(outDir, fileName);
    fs.writeFileSync(outPath, migrationCode, { encoding: 'utf8' });
    createdFiles.push(outPath);
    // small pause to ensure unique timestamps
    await new Promise((r) => setTimeout(r, 20));
  }

  console.log('Generated migrations:');
  createdFiles.forEach((f) => console.log(' -', f));
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
