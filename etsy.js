const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const fetch = require('node-fetch');
const { OAuth } = require('oauth');
const config = require('./config.json');

const CREDENTIALS_FILE = path.join(os.homedir(), '.etsy-utils');
const API_URL = 'https://openapi.etsy.com/v2/';
const uri = (strings, ...args) => {
  return strings.reduce((out, s, i) => out + s + (args[i] !== undefined ? encodeURIComponent(args[i]) : ''), '');
};
const query = (args) => {
  const entries = Object.entries(args);
  if (entries.length === 0) { return ''; }
  return '?' + entries
    .map((key, value) => uri`${key}=${value}`)
    .join('&');
};
const url = (endpoint, args = {}) => `${API_URL}${endpoint}${query(args)}`;

module.exports = class Etsy {
  static async authenticate() {
    const oauth = new OAuth(
      'https://openapi.etsy.com/v2/oauth/request_token?scope=transactions_r',
      'https://openapi.etsy.com/v2/oauth/access_token',
      config.keystring,
      config.sharedsecret,
      '1.0A',
      null,
      'HMAC-SHA1',
    );
    oauth.setClientOptions({ accessTokenHttpMethod: 'GET' });

    if (fs.existsSync(CREDENTIALS_FILE)) {
      try {
        const authtoken = JSON.parse(await fs.promises.readFile(CREDENTIALS_FILE, 'utf8'));
        return new Etsy(oauth, authtoken);
      } catch (error) {} // If we cannot read the file, just ignore it.
    }

    const { token, secret, login_url } = await new Promise((resolve, reject) => {
      oauth.getOAuthRequestToken((error, token, secret, results) => {
        if (error) { return reject(error); }
        resolve({ token, secret, ...results });
      });
    });

    const prompt = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const verifier = await new Promise((resolve) => {
      prompt.question(`Visit < ${login_url} > in your browser to authorize this app.\nEnter the code received: `, resolve)
    });

    const authtoken = await new Promise((resolve, reject) => {
      oauth.getOAuthAccessToken(token, secret, verifier, (error, token, secret) => {
        if (error) { return reject(error); }
        resolve({ token, secret });
      });
    });

    await fs.promises.writeFile(CREDENTIALS_FILE, JSON.stringify(authtoken));
    return new Etsy(oauth, authtoken);
  }

  constructor(oauth, { token, secret }) {
    this.oauth = oauth;
    this.authtoken = [token, secret];
  }

  async get(endpoint, args = {}) {
    return new Promise((resolve, reject) => {
      this.oauth.get(url(endpoint, args), ...this.authtoken, (error, result) => {
        if (error) { return reject(error); }
        resolve(JSON.parse(result));
      });
    })
  }

  async getAll(endpoint, args = {}) {
    const STEP = 100;
    let results = [];
    let count = null;
    let offset = 0;
    while (results.length !== count) {
      const response = await this.get(endpoint, { ...args, offset, limit: STEP });
      count = response.count;
      results.push(...response.results);
      offset += STEP;
    }
    return results;
  }
}
