"use strict";
import { workspace, window, ExtensionContext, commands,
    TextEditor, TextDocumentContentProvider, EventEmitter,
    Event, Uri, TextDocumentChangeEvent, ViewColumn,
    TextEditorSelectionChangeEvent,
    TextDocument, Disposable } from "vscode";
import * as fs from "fs";
import * as path from "path";
let fileUrl = require("file-url");

export function activate(context: ExtensionContext) {

    let previewUri: Uri;

    let provider: HtmlDocumentContentProvider;
    let registration: Disposable;

    workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
        if (e.document === window.activeTextEditor.document) {
            provider.update(previewUri);
        }
    });

    workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
        if (e.document === window.activeTextEditor.document) {
            provider.update(previewUri);
        }
    });

    function sendHTMLCommand(displayColumn: ViewColumn): PromiseLike<void> {
        let previewTitle = `Preview: '${path.basename(window.activeTextEditor.document.fileName)}'`;
        provider = new HtmlDocumentContentProvider();
        registration = workspace.registerTextDocumentContentProvider("html-preview", provider);
        previewUri = Uri.parse(`html-preview://preview/${previewTitle}`);
        return commands.executeCommand("vscode.previewHtml", previewUri, displayColumn).then((success) => {
        }, (reason) => {
            console.warn(reason);
            window.showErrorMessage(reason);
        });
    }

    let previewToSide = commands.registerCommand("html.previewToSide", () => {
        let displayColumn: ViewColumn;
        switch (window.activeTextEditor.viewColumn) {
            case ViewColumn.One:
                displayColumn = ViewColumn.Two;
                break;
            case ViewColumn.Two:
            case ViewColumn.Three:
                displayColumn = ViewColumn.Three;
                break;
        }
        return sendHTMLCommand(displayColumn);
    });

    let preview = commands.registerCommand("html.preview", () => {
        return sendHTMLCommand(window.activeTextEditor.viewColumn);
    });

    context.subscriptions.push(preview, previewToSide, registration);
}

enum SourceType {
    SCRIPT,
    STYLE
}

class HtmlDocumentContentProvider implements TextDocumentContentProvider {
    private _onDidChange = new EventEmitter<Uri>();

    public provideTextDocumentContent(uri: Uri): string {
        return this.createHtmlSnippet();
    }

    get onDidChange(): Event<Uri> {
        return this._onDidChange.event;
    }

    public update(uri: Uri) {
        this._onDidChange.fire(uri);
    }

    private createHtmlSnippet(): string {
        let editor = window.activeTextEditor;
        if (!(editor.document.languageId === "html")) {
            return this.errorSnippet("Active editor doesn't show a HTML document - no properties to preview.");
        }
        return this.preview(editor);
    }

    private errorSnippet(error: string): string {
        return `
                <body>
                    ${error}
                </body>`;
    }

    private createLocalSource(file: string, type: SourceType) {
        let source_path = fileUrl(
            path.join(
                __dirname,
                "..",
                "..",
                "static",
                file
            )
        );
        switch (type) {
            case SourceType.SCRIPT:
                return `<script src="${source_path}"></script>`;
            case SourceType.STYLE:
                return `<link href="${source_path}" rel="stylesheet" />`;
        }
    }

    private fixLinks(document: string, documentPath: string): string {
        return document.replace(
            new RegExp("((?:src|href)=[\'\"])((?!http|\\/).*?)([\'\"])", "gmi"), (subString: string, p1: string, p2: string, p3: string): string => {
                return [
                    p1,
                    fileUrl(path.join(
                        path.dirname(documentPath),
                        p2
                    )),
                    p3
                ].join("");
            }
        );
    }

    public preview(editor: TextEditor): string {
        let doc = editor.document;
        return this.createLocalSource("header_fix.css", SourceType.STYLE) + this.fixLinks(doc.getText(), doc.fileName);
    }
}
