import { close } from 'fs';
import * as vscode from 'vscode';

export interface EvolveConfig {
    deployment: {
        'allowed-targets': string[],
        hooks: {
            before: string[],
            after: string[],
        },
        'keep-releases': number,
        server: {
            host: string
            path: string
            user: string
        },
        target: string
    }
}

export function registerAndPushCommand(context: vscode.ExtensionContext, command: string, callback: (...args: any[]) => any, thisArg?: any) {
    context.subscriptions.push(vscode.commands.registerCommand(command, callback))
}

export async function parseLaraveConfig(filePath: string): Promise<EvolveConfig> {
    const runner = require('child_process');

    return new Promise((resolve, reject) => {
        if (!vscode.workspace.workspaceFolders) {
            return reject()
        }

        runner.exec(
            `php artisan tinker --execute="echo json_encode(config('evolve'));"`,
            {
                cwd: vscode.workspace.workspaceFolders[0].uri.fsPath
            },
            function (err: any, stdout: any, stderr: any) {
                if (stdout) {
                    const config = JSON.parse(stdout)
                    return resolve(config)
                }
            }
        );
    })
}

export async function getProcessOutput(command: string): Promise<string> {
    const process = require('child_process')

    return new Promise((resolve, reject) => {
        if (!vscode.workspace.workspaceFolders) {
            return reject()
        }

        process.exec(command, { cwd: vscode.workspace.workspaceFolders[0].uri.fsPath }, (err: any, stdout: any, stderr: any) => {
            if (stdout) {
                return resolve(stdout)
            }
        })
    })
}