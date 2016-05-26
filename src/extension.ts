"use strict";
import { window, ExtensionContext, commands, Uri,
    ViewColumn, TextDocument, TextEditor } from "vscode";
import { HtmlDocumentView } from "./document";

export enum SourceType {
    SCRIPT,
    STYLE
}

export function activate(context: ExtensionContext) {
    const viewManager = new ViewManager();

    context.subscriptions.push(
        commands.registerTextEditorCommand("html.previewToSide", textEditor => {
            viewManager.previewToSide(textEditor);
        }),
        commands.registerTextEditorCommand("html.preview", textEditor => {
            viewManager.preview(textEditor);
        })
    );
}

class ViewManager {
    private fileMap: Map<Uri, HtmlDocumentView> = new Map();

    private sendHTMLCommand(displayColumn: ViewColumn, doc: TextDocument, toggle: boolean = false) {
        if (!this.fileMap.has(doc.uri)) {
            this.fileMap.set(doc.uri, new HtmlDocumentView(doc));
        }
        if (toggle) {
            this.fileMap.get(doc.uri).executeToggle(displayColumn);
        } else {
            this.fileMap.get(doc.uri).executeSide(displayColumn);
        }
    }

    public previewToSide(textEditor: TextEditor) {
        let displayColumn: ViewColumn;
        switch (textEditor.viewColumn) {
            case ViewColumn.One:
                displayColumn = ViewColumn.Two;
                break;
            case ViewColumn.Two:
            case ViewColumn.Three:
                displayColumn = ViewColumn.Three;
                break;
        }
        this.sendHTMLCommand(displayColumn,
            window.activeTextEditor.document);
    }

    public preview(textEditor: TextEditor) {
        this.sendHTMLCommand(textEditor.viewColumn,
            window.activeTextEditor.document, true);
    }
}
