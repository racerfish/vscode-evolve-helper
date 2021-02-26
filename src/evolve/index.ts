import * as vscode from 'vscode';
import { existsSync } from "fs"
import { join } from "path"

export function isEvolveProject() {
    if (!vscode.workspace.workspaceFolders) {
        return false
    }

    return existsSync(join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'config/evolve.php'))
}