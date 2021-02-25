import { EOL } from 'os';
import * as vscode from 'vscode';
import { isEvolveProject } from './evolve';
import { deploy, deployFile } from './evolve/deploy';
import { runOnServer } from './evolve/terminal';
import { getOrCreateTerminal } from './evolve/terminal';
import { getProcessOutput, registerAndPushCommand } from './util';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	if (!vscode.workspace.workspaceFolders) {
		console.log('No workspace found, terminating extension')
		return
	}

	const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath

	registerAndPushCommand(context, 'evolve-helpers.deploy', () => {
		deploy()
	})

	registerAndPushCommand(context, 'evolve-helpers.deploy.file', (event) => {
		if (!isEvolveProject()) {
			vscode.window.showWarningMessage('Could not find config/evolve.php')
			return
		}

		if (event && event.path) {
			const filePath = event.path.replace(workspacePath + '/', '')

			deployFile(filePath)
		} else {
			const currentFilePath = vscode.window.activeTextEditor?.document.fileName

			vscode.window.showInputBox({
				prompt: 'Enter file path',
				placeHolder: 'A relative file path',
				value: currentFilePath ? currentFilePath.replace(workspacePath + '/', '') : undefined,
			}).then(value => {
				if (value) {
					deployFile(value)
				}
			})
		}
	})

	registerAndPushCommand(context, 'evolve-helpers.run-server-command', async () => {
		const command = await vscode.window.showInputBox({
			prompt: 'Enter a command to run on the server',
			placeHolder: 'A terminal command',
			value: 'php artisan ',
			valueSelection: [12, 12]
		})

		if (command) {
			runOnServer(command)
		}
	})

	registerAndPushCommand(context, 'evolve-helpers.run-envoy-task', async () => {
		const envoyOutput = await getProcessOutput('./vendor/laravel/envoy/bin/envoy tasks')
		const envoyTasks = envoyOutput
			.split(EOL)
			.map(line => line.trim())
			.filter(line => !['Available tasks:', 'Available stories:'].includes(line))
			.filter(line => line.length > 0)
			.sort()

		const task = await vscode.window.showQuickPick(envoyTasks.map(task => ({
			label: '$(play)  ' + task,
			task,
		})), {
			canPickMany: false
		})

		if (task) {
			const terminal = getOrCreateTerminal()

			terminal.sendText(`./vendor/laravel/envoy/bin/envoy run ${task.task}`)
			terminal.show()
		}
	})
}

// this method is called when your extension is deactivated
export function deactivate() { }
