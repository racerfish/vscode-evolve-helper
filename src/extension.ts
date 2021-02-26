import { EOL } from 'os';
import * as vscode from 'vscode';
import { isEvolveProject } from './evolve';
import { deploy, deployFile } from './evolve/deploy';
import { runOnServer, getOrCreateTerminal } from './evolve/terminal';
import { ComponentDefinition, createComponent } from "./evolve/component";
import { assurePathExists, getProcessOutput, registerAndPushCommand } from './util';
import { copyFileSync } from 'fs';
import { basename, join } from 'path';
import slugify from 'slugify';

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

	registerAndPushCommand(context, 'evolve-helpers.component.create', async () => {
		const name = await vscode.window.showInputBox({
			prompt: 'Enter a component name',
			placeHolder: 'Name of an existing or new component *.yaml definition',
		})

		if (name) {
			const component: ComponentDefinition = {
				name: 'A new component',
				component: 'custom.' + slugify(name),
				icon: 'fad fa-cubes',
				block: true,
				media: false,
				fields: [
					{
						type: 'string',
						label: 'Titel',
						name: 'title'
					}
				]
			}

			const componentUri = createComponent(name, component)

			if (componentUri) {
				vscode.window.showTextDocument(componentUri)
			}
		}
	})

	registerAndPushCommand(context, 'evolve-helpers.component.extend', async () => {
		const files = await vscode.workspace.findFiles(`vendor/**/config/components/*.yaml`)

		const selected = await vscode.window.showQuickPick(files.map(file => ({
			label: basename(file.fsPath, '.yaml'),
			detail: file.fsPath.replace(workspacePath + '/', ''),
			file,
		})), {
			canPickMany: false,
			placeHolder: 'Choose a component to extend'
		})

		if (selected) {
			const componentFilePath = join(workspacePath, `config/components/${slugify(selected.label)}.yaml`)

			assurePathExists(componentFilePath)
			copyFileSync(selected.file.fsPath, componentFilePath)
			vscode.window.showTextDocument(vscode.Uri.file(componentFilePath))
		}
	})
}

// this method is called when your extension is deactivated
export function deactivate() { }
