import * as vscode from 'vscode';
import { join } from "path"
import slugify from "slugify"
import { dump } from "js-yaml";
import { writeFileSync } from 'fs';

export interface ComponentDefinition {
    name: string
    component: string
    icon: string
    block?: boolean
    media?: boolean | { accept: string, max?: number }
    fields: ComponentFieldDefinition[]
}

export interface ComponentFieldDefinition {
    type: string
    label: string
    name: string
    repeatable?: boolean
}

export function createComponent(name: string, component: ComponentDefinition) {
    if (!vscode.workspace.workspaceFolders) {
        return false
    }

    const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath
    const componentYamlData = dump(component)
    const componentFilePath = join(workspacePath, `config/components/${slugify(name)}.yaml`)

    writeFileSync(componentFilePath, componentYamlData)

    return vscode.Uri.file(componentFilePath)
}
