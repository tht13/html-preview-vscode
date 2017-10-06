"use strict";
import {
    window, ExtensionContext, commands, Uri,
    ViewColumn, TextDocument, TextEditor, workspace
} from "vscode";
import * as uuid from "uuid";
import { HtmlDocumentView } from "./document";

export enum SourceType {
    SCRIPT,
    STYLE
}
let viewManager: ViewManager;
export function activate(context: ExtensionContext): void {
    console.log("active");
    viewManager = new ViewManager();

    context.subscriptions.push(
        commands.registerTextEditorCommand("html.previewToSide", editor => viewManager.preview(editor, true)),
        commands.registerTextEditorCommand("html.preview", editor => viewManager.preview(editor)),
        commands.registerTextEditorCommand("html.source", () => viewManager.source())
    );
}

export function deactivate(): void {
    console.log("deactivate");
    viewManager.dispose();
}

class ViewManager {
    private idMap: IDMap = new IDMap();
    private fileMap: Map<string, HtmlDocumentView> = new Map<string, HtmlDocumentView>();

    private sendHTMLCommand(displayColumn: ViewColumn, doc: TextDocument, toggle: boolean = false): Thenable<any> {
        let id: string;
        let htmlDoc: HtmlDocumentView;
        if (!this.idMap.hasUri(doc.uri)) {
            htmlDoc = new HtmlDocumentView(doc);
            id = this.idMap.add(doc.uri, htmlDoc.uri);
            this.fileMap.set(id, htmlDoc);
        } else {
            id = this.idMap.getByUri(doc.uri);
            htmlDoc = this.fileMap.get(id);
        }
        return htmlDoc.execute(displayColumn);
    }

    private getViewColumn(sideBySide: boolean): ViewColumn {
        const active: TextEditor = window.activeTextEditor;
        if (!active) {
            return ViewColumn.One;
        }

        if (!sideBySide) {
            return active.viewColumn;
        }

        switch (active.viewColumn) {
            case ViewColumn.One:
                return ViewColumn.Two;
            case ViewColumn.Two:
                return ViewColumn.Three;
        }

        return active.viewColumn;
    }

    public source(mdUri?: Uri): Thenable<any> {
        if (!mdUri) {
            return commands.executeCommand("workbench.action.navigateBack");
        }

        const docUri: Uri = Uri.parse(mdUri.query);

        for (let editor of window.visibleTextEditors) {
            if (editor.document.uri.toString() === docUri.toString()) {
                return window.showTextDocument(editor.document, editor.viewColumn);
            }
        }

        return workspace.openTextDocument(docUri).then(doc => {
            return window.showTextDocument(doc);
        });
    }

    public async preview(editor: TextEditor, sideBySide: boolean = false): Promise<void> {
        let resource: Uri = editor.document.uri;

        if (!window.activeTextEditor) {
            // this is most likely toggling the preview
            commands.executeCommand("html.source");
            return;
        }

        // activeTextEditor does not exist when triggering on a html preview
        await this.sendHTMLCommand(this.getViewColumn(sideBySide),
            window.activeTextEditor.document);
    }

    public dispose(): void {
        for (let document of this.fileMap.values()) {
            document.dispose();
        }
    }
}

class IDMap {
    private map: Map<[Uri, Uri], string> = new Map<[Uri, Uri], string>();

    public getByUri(uri: Uri): string {
        for (let key of this.map.keys()) {
            if (key.indexOf(uri) > -1) {
                return this.map.get(key);
            }
        }
        return null;
    }

    public hasUri(uri: Uri): boolean {
        return this.getByUri(uri) !== null;
    }

    public add(uri1: Uri, uri2: Uri): string {
        let id: string = uuid.v4();
        this.map.set([uri1, uri2], id);
        return id;
    }
}
