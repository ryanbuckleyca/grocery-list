import { readdirSync } from 'fs';
import { basename as _basename } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import Sequelize from 'sequelize';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = _basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = fs.readFileSync('config/config.json');
const configOptions = JSON.parse(config)[env]
const db = {};

let sequelize;

if (configOptions.use_env_variable) {
  sequelize = new Sequelize(process.env[configOptions.use_env_variable], configOptions);
} else {
  sequelize = new Sequelize(configOptions.database, configOptions.username, configOptions.password, configOptions);
}

const loadModels = async () => {
  const files = readdirSync(__dirname);

  for (const file of files) {
    if (file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js') {
      const modelModule = await import(`./${file}`);
      const model = modelModule.default(sequelize, Sequelize);
      db[model.name] = model;
    }
  }

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });
};

loadModels();

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
