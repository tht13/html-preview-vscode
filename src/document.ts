import {
    workspace, window, commands, TextDocumentContentProvider,
    Event, Uri, TextDocumentChangeEvent, ViewColumn, EventEmitter,
    TextDocument, Disposable
} from "vscode";
import * as path from "path";
import fileUrl = require("file-url");

const validFiles: string[] = ["html", "jade"];

export class HtmlDocumentView {
    private provider: HtmlDocumentContentProvider;
    private registrations: Disposable[] = [];
    private previewUri: Uri;
    private doc: TextDocument;

    constructor(document: TextDocument) {
        this.doc = document;
        this.provider = new HtmlDocumentContentProvider(this.doc);
        this.registrations.push(workspace.registerTextDocumentContentProvider("html", this.provider));
        this.previewUri = this.getHTMLUri(document.uri);
        this.registerEvents();
    }

    public get uri(): Uri {
        return this.previewUri;
    }



    private getHTMLUri(uri: Uri): Uri {
        return uri.with({ scheme: "html", path: uri.path + ".rendered", query: uri.toString() });
    }

    private registerEvents(): void {
        workspace.onDidSaveTextDocument(document => {
            if (this.isValidFile(document)) {
                const uri: Uri = this.getHTMLUri(document.uri);
                this.provider.update(uri);
            }
        });

        workspace.onDidChangeTextDocument(event => {
            if (this.isValidFile(event.document)) {
                const uri: Uri = this.getHTMLUri(event.document.uri);
                this.provider.update(uri);

            }
        });

        workspace.onDidChangeConfiguration(() => {
            workspace.textDocuments.forEach(document => {
                if (document.uri.scheme === "html") {
                    // update all generated md documents
                    this.provider.update(document.uri);
                }
            });
        });
        this.registrations.push(workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
            if (!this.visible) {
                return;
            }
            if (e.document === this.doc) {
                this.provider.update(this.previewUri);
            }
        }));
    }

    private get visible(): boolean {
        for (let editor of window.visibleTextEditors) {
            if (editor.document.uri === this.previewUri) {
                return true;
            }
        }
        return false;
    }

    public execute(column: ViewColumn): Thenable<any> {
        return commands.executeCommand("vscode.previewHtml", this.previewUri, column,
            `Preview '${path.basename(this.uri.fsPath)}'`).then(
            (success) => success,
            (reason) => {
                console.warn(reason);
                window.showErrorMessage(reason);
            });
    }

    public dispose(): void {
        for (let registration of this.registrations) {
            registration.dispose();
        }
    }

    private isValidFile(document: TextDocument): boolean {
        return validFiles.includes(document.languageId)
            && document.uri.scheme !== "html"; // prevent processing of own documents
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

    public update(uri: Uri): void {
        this._onDidChange.fire(uri);
    }

    private createHtmlSnippet(): string {
        if (!validFiles.includes(this.doc.languageId)) {
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

    private fixLinks(): string {
        return this.doc.getText().replace(
            new RegExp("((?:src|href)=[\'\"])((?!http|\/|data:\w+\/\w+;base64).*?)([\'\"])", "gmi"),
            (subString: string, p1: string, p2: string, p3: string): string => {
                // avoid failing base64 negative lookahead
                const match = subString.match(new RegExp("data:\w+\/\w+;base64"));
                return match === null ? subString : [
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
        return this.fixLinks();
    }
}
