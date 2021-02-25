import { readFileSync } from 'fs';
import { EOL } from 'os';
import { join } from 'path';
import * as vscode from 'vscode';
import { parseLaraveConfig } from '../util';
import { runTerminalCommand } from "./terminal";

interface DeploymentAction extends vscode.QuickPickItem {
    value: string,
}

export async function deploy() {
    const quickPick = vscode.window.createQuickPick<DeploymentAction>()
    quickPick.busy = true
    quickPick.enabled = false
    quickPick.canSelectMany = false
    quickPick.title = 'Evolve Deployment'
    quickPick.placeholder = 'Loading Evolve configuration ...'
    quickPick.show()

    const { deployment } = await parseLaraveConfig('evolve')

    quickPick.title += ` to ${deployment.target} on ${deployment.server.user}@${deployment.server.host}`
    quickPick.busy = false
    quickPick.enabled = true
    quickPick.placeholder = 'How do you want to deploy?'
    quickPick.items = [
        {
            value: 'dry-run',
            label: '$(debug-alt)  Dry-run',
            detail: 'Simulates a deployment and shows possible changes',
        }, {
            value: 'live',
            label: '$(globe)  Live',
            detail: 'Actually starts a deployment to the target',
        }, {
            value: 'rollback',
            label: '$(history)  Rollback',
            detail: 'Rolls back a previously deployed release',
        }, {
            value: 'config',
            label: '$(gear)  Change configuration',
            detail: 'Open config/evolve.php to change the deployment configuration'
        }
    ]

    quickPick.onDidAccept(async () => {
        const action = quickPick.activeItems[0]

        if (action?.value === 'dry-run') {
            runTerminalCommand('php artisan deploy --dry-run')
        } else if (action?.value === 'live') {
            runTerminalCommand('php artisan deploy --force')
        } else if (action?.value === 'rollback') {
            runTerminalCommand('php artisan deploy --rollback')
        } else if (action?.value === 'config') {
            if (vscode.workspace.workspaceFolders) {
                const document = await vscode.workspace.openTextDocument(join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'config/evolve.php'))
                const lines = document.getText().split(EOL)
                const deploymentAtLine = lines.findIndex(line => line.includes("'deployment'")) + 1

                vscode.window.activeTextEditor?.revealRange(new vscode.Range(
                    new vscode.Position(deploymentAtLine, 0),
                    new vscode.Position(deploymentAtLine + 20, 0),
                ))

                vscode.window.showTextDocument(document)
            }
        }

        quickPick.dispose()
    })
}

export function deployFile(filePath: string) {
    runTerminalCommand(`php artisan deploy --file="${filePath}"`)
}