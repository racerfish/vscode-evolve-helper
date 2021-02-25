import * as vscode from 'vscode';
import { parseLaraveConfig } from '../util';

export function runTerminalCommand(command: string, name: string = 'Evolve') {
    const terminal = getOrCreateTerminal(name)

    terminal.sendText(command)
    terminal.show(true)

    return terminal
}

export function getOrCreateTerminal(name: string = 'Evolve') {
    return vscode.window.activeTerminal || vscode.window.createTerminal({
        name,
        hideFromUser: false,
    })
}

export async function runOnServer(command: string) {
    const { deployment } = await parseLaraveConfig('evolve')
    
    runTerminalCommand(`ssh -t ${deployment.server.user}@${deployment.server.host} 'cd ${deployment.server.path}/${deployment.target}/current && ${command}'`)
}