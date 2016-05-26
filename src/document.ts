import { workspace, window, commands, TextDocumentContentProvider,
    Event, Uri, TextDocumentChangeEvent, ViewColumn, EventEmitter,
    TextDocument, Disposable } from "vscode";
import * as path from "path";
import fileUrl = require("file-url");
import { SourceType } from "./extension";

export class HtmlDocumentView {
    private provider: HtmlDocumentContentProvider;
    private registration: Disposable;
    private title: string;
    private previewUri: Uri;
    private doc: TextDocument;

    constructor(document: TextDocument) {
        this.doc = document;
        this.title = `Preview: '${path.basename(window.activeTextEditor.document.fileName)}'`;
        this.provider = new HtmlDocumentContentProvider(this.doc);
        this.registration = workspace.registerTextDocumentContentProvider("html-preview", this.provider);
        this.previewUri = Uri.parse(`html-preview://preview/${this.title}`);
        this.registerEvents();
    }
    
    public get uri(): Uri {
        return this.previewUri;
    }

    private registerEvents() {
        workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
            if (!this.visible) {
                return;
            }
            if (e.document === this.doc) {
                this.provider.update(this.previewUri);
            }
        });
    }

    private get visible(): boolean {
        for (let i in window.visibleTextEditors) {
            if (window.visibleTextEditors[i].document.uri === this.previewUri) {
                return true;
            }
        }
        return false;
    }

    public executeToggle(column: ViewColumn) {
        if (this.visible) {
            window.showTextDocument(this.doc, column);
            this.visible = false;
        } else {
            this.execute(column);
        }
    }

    public executeSide(column: ViewColumn) {
        window.showTextDocument(this.doc, column);
    }

    private execute(column: ViewColumn) {
        commands.executeCommand("vscode.previewHtml", this.previewUri, column).then((success) => {
        }, (reason) => {
            console.warn(reason);
            window.showErrorMessage(reason);
        });
    }
}

class HtmlDocumentContentProvider implements TextDocumentContentProvider {
    private _onDidChange = new EventEmitter<Uri>();
    private doc: TextDocument;

    constructor(document: TextDocument) {
        this.doc = document;
    }

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
        if (this.doc.languageId !== "html" && this.doc.languageId !== "jade") {
            return this.errorSnippet("Active editor doesn't show a HTML or Jade document - no properties to preview.");
        }
        return this.preview();
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

    private fixLinks(): string {
        return this.doc.getText().replace(
            new RegExp("((?:src|href)=[\'\"])((?!http|\\/).*?)([\'\"])", "gmi"),
            (subString: string, p1: string, p2: string, p3: string): string => {
                return [
                    p1,
                    fileUrl(path.join(
                        path.dirname(this.doc.fileName),
                        p2
                    )),
                    p3
                ].join("");
            }
        );
    }

    public preview(): string {
        return this.createLocalSource("header_fix.css", SourceType.STYLE) +
            this.fixLinks();
    }
}
