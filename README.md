# Etsy Utilities

Some small scripts to help sell stuff on Etsy I guess.

## Setup

Before this will work, you need to get an API key for your app from Etsy. Put the 3 values in a file
`config.json` in this directory, with the following structure:

```json
{
    "appname": "",
    "keystring": "",
    "sharedsecret": ""
}
```

## Usage

These scripts use [Node.js](https://nodejs.org/). Install that first, then install dependencies as follows:

```bash
npm install
```

After that the scripts should work.

```bash
# Generates a PDF containing mailing addresses for every open order, 1 per page.
./addresses/addresses
```

## Credentials

The first time you use any of these scripts, it will require you to authorize the app. On subsequent uses
the app should be ok. Your current credentials are stored in the file `.etsy-utils` in your home directory.
If you are ever having trouble with credentials, or need to change your credentials, delete that file.
