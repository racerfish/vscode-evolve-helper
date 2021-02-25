import * as vscode from 'vscode';
import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { parseLaraveConfig } from '../util';

export function isEvolveProject() {
    if (!vscode.workspace.workspaceFolders) {
        return false
    }

    return existsSync(join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'config/evolve.php'))
}