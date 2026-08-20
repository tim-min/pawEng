#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { existsSync, statSync, copyFileSync, writeFileSync, readFileSync } from 'fs';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const workDir = process.cwd();

const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    reset: '\x1b[0m',
}

proccessCommand(args);

function proccessCommand(input) {
    const [command, args] = [input[0], input.slice(1)];

    switch (command) {
        default:
            help();
            break;
        case 'run':
            run(args);
            break;
        case 'build':
            build(args);
            break;
    }
}

function help() {
    console.log(`${colors.cyan}\npawEng / by @tim-min\n${colors.reset}`);
    console.log("Usage:\n");
    console.log(`${colors.green}help${colors.reset}\t\t\t\t\t- for help`);
    console.log(`${colors.green}run${colors.reset} ${colors.gray}[--host] [--port <port>]${colors.reset}\t\t- to run server using Vite`);
    console.log(`${colors.green}build${colors.reset}${colors.gray} --web [--out <output folder>] ${colors.reset}\t- to build for Web`)
    console.log(`${colors.green}build${colors.reset}${colors.gray} {--win | --linux | --osx} ${colors.reset}\t- to build for Windows, Linux or Mac`)
    console.log(`${colors.gray}\tOptions:\n\n\t[--web-dir <web build folder>]\n\t[--name <game name>]\n\t[--company <company name>]\n\t[--version <version>]\n\t[--description <description>]}\n\t[--out <output folder>]${colors.reset}`)
}

function viteInstalled() {
    try {
        execSync('npx vite --version', {cwd: workDir, stdio: 'ignore'});
        return true;
    } catch {
        return false;
    }
}

function nwInstalled() {
    try {
        const userRequire = createRequire(path.join(workDir, 'package.json'));
        const nw = userRequire('nw-builder');
    } catch {
        return false;
    }

    return true;
}

function checkFolder(_path) {
    if (existsSync(_path) && statSync(_path).isFile())
        return false;

    return true;
}

function buildWeb(args) {
    if (!viteInstalled()) {
        console.error(`${colors.red}[!]${colors.reset} Please install Vite before running server.\n${colors.gray}npm install vite${colors.reset}`);
        return;
    }
    if (!checkFolder(args['--out'])) {
        console.log(`${colors.red}[!]${colors.reset} Invalid output folder. Use help if you need help.`);
        return;
    }

    execSync(`npx vite build --outDir ${args['--out']}`, {stdio: 'inherit', cwd: workDir});
}

function fixPackageJson(content, gameName) {
    let fixed = (!content.main || !content.name);

    if (!content.main)
        content.main = "index.html";

    if (!content.name)
        content.name = gameName;

    return fixed;
}

function getJsonFromFile(src) {
    const file = readFileSync(src, 'utf8');
    
    return JSON.parse(file);
}

function checkIcon() {
    let icoPath = path.join(workDir, 'icon.ico');
    return (existsSync(icoPath) && statSync(icoPath).isFile())
}

async function buildExecutable(args) {
    if (!nwInstalled()) {
        console.log(`${colors.red}[!]${colors.reset} Please install nw-builder before creating windows or linux or mac builds.]\n${colors.gray}npm install nw-builder${colors.reset}`);
        return;
    }
    if (!checkFolder(args['--out'])) {
        console.log(`${colors.red}[!]${colors.reset} Invalid output folder. Use help if you need help.`);
        return;
    }
    if (!checkFolder(args['--web-dir'])) {
        console.log(`${colors.red}[!]${colors.reset} Invalid web build folder. Use help if you need help.`);
        return;
    }

    const webBuildDirPath = path.join(workDir, args['--web-dir']); // web build is need to create executable build
    const outDirPath = path.join(workDir, args['--out']);

    const webHeadFile = path.join(webBuildDirPath, 'index.html');
    if (!existsSync(webHeadFile)) {
        console.log(`${colors.red}[!]${colors.reset} index.html not found in ${webBuildDirPath}`);
        return;
    }

    try {
        const userRequire = createRequire(path.join(workDir, 'package.json'));
        const nw = userRequire('nw-builder');
        const nwbuild = nw.default || nw; 

        copyFileSync(path.join(workDir, "package.json"), path.join(webBuildDirPath, 'package.json'));

        // Need to check package.json bcs nw requires "main" field

        let packageJsonContent = getJsonFromFile(path.join(webBuildDirPath, 'package.json'));

        if (fixPackageJson(packageJsonContent, args['--name'])) {
            console.warn(`\n${colors.red}[!]${colors.reset} package.json does not have a 'main' or 'name' fields for nw-builder, so it will be selected by default 'index.html' and your game name`);
            writeFileSync(path.join(webBuildDirPath, 'package.json'), JSON.stringify(packageJsonContent, null, 2));
        }

        if (!checkIcon()) 
            console.warn(`\n${colors.red}[!]${colors.reset} It is advisable to add icon.ico to the root of the project`);

        await nwbuild({
            srcDir: webBuildDirPath,
            mode: 'build',
            version: 'stable',
            glob: false,
            platform: args['system'],
            arch: 'x64',
            outDir: outDirPath,

            app: {
                name: args['--name'],
                version: args['--version'],
                company: args['--company'],
                fileDescription: args['--description'],
                legalCopyright: `Copyright (c) ${new Date().getFullYear()}`,
                icon: path.resolve(workDir, 'icon.ico'),
                LSApplicationCategoryType: 'public.app-category.games',
                CFBundleVersion: args['--version'],
                CFBundleShortVersionString: args['--version'],
                CFBundleIdentifier: `com.${(args['--company']).toLowerCase()}.${(args['--name'] || 'game').toLowerCase().replace(/\s/g, '')}`,
                NSHumanReadableCopyright: `Copyright © ${new Date().getFullYear()} ${args['--company']}`
            },

            cacheDir: path.join(workDir, 'build-cache'),
            cache: true,
            zip: false,
        })

        console.log(`${colors.green}[!]${colors.reset} Successfully build to ${outDirPath}`);
    } catch (e) {
        console.error(`Build failed. Error:\n${e}`);

        if (e.stack) {
            console.error(e.stack);
        }
    }
}

function build(args) {
    let type;

    let namedArgs = {
        'system': 'win',
        '--out': false,
        '--web-dir': false,
        '--name': 'pawgame',
        '--company': 'company',
        '--version': '1.0.0',
        '--description': 'placeholder',
    }

    let possibleSystems = {
        '--win': 'win',
        '--linux': 'linux',
        '--osx': 'osx',
        '--web': 'web'
    }

    for (let x=0; x<args.length; x++) {
        if (args[x] in namedArgs) {
            if (x+1 >= args.length) {
                console.log(`${colors.red}[!]${colors.reset} Incorrect arguments. Use help if you need help.`);
                return;
            }

            namedArgs[args[x]] = args[x+1];
            x+=1;
        } else if (args[x] in possibleSystems) {
            type = possibleSystems[args[x]];
            namedArgs['system'] = possibleSystems[args[x]];
        }
    }

    switch (type) {
        default:
            console.log(`${colors.red}[!]${colors.reset} Incorrect arguments. Use help if you need help.`);
            break;
        case 'web':
            if (!namedArgs['--out']) namedArgs['--out'] = 'webBuild';

            buildWeb(namedArgs);
            break;
        case "win":
        case "linux":
        case "osx":
            if (!namedArgs['--out']) namedArgs['--out'] = 'executableBuild';
            if (!namedArgs['--web-dir']) namedArgs['--web-dir'] = 'webBuild';

            buildExecutable(namedArgs);
    } 
}

function run(args) {
    let port = '8080';
    let host = false;

    for (let x=0; x<args.length; x+=1) {
        if (args[x] == '--host') 
            host = true;
        else if (args[x] == '--port') {
            if (x+1 >= args.length) {
                console.log(`${colors.red}[!]${colors.reset} Incorrect arguments. Use help if you need help.`);
                return;
            }
            port = args[x+1];
            x += 1;
        }
    }

    port = parseInt(port, 10);

    if (isNaN(port) || port < 1 || port > 65535) {
        console.log(`${colors.red}[!]${colors.reset} Invalid port. Use number between 1 and 65535.`);
        return;
    }

    if (!viteInstalled()) {
        console.log(`${colors.red}[!]${colors.reset} Please install Vite before running server.\n${colors.gray}npm install vite${colors.reset}`);
        return;
    }

    const headFile = path.join(workDir, "index.html");

    if (!existsSync(headFile)) {
        console.log(`${colors.red}[!]${colors.reset} index.html not found. Make sure that you are running server from your project folder.`);
        return;
    }

    execSync(`npx vite --port ${port}${(host) ? ' --host' : ''}`, {stdio: 'inherit', cwd: workDir});
}