import * as ts from 'typescript';
import * as fs from 'fs';
import * as vscode from 'vscode';

class ClassScrubber {
  private program!: ts.Program;
  private _ignoreFiles: string[];

  private statusBarItem: vscode.StatusBarItem;

  constructor(private workspaceRoot: string) {
    this._ignoreFiles = [];

    const host = ts.createCompilerHost({ target: ts.ScriptTarget.ES5 });

    const configFile = ts.findConfigFile(this.workspaceRoot, ts.sys.fileExists, 'tsconfig.json');
    if (configFile) {
      const config = ts.readConfigFile(configFile, ts.sys.readFile);
      const sourceFiles = config.config.files;
      this.program = ts.createProgram(sourceFiles, {}, host);
    }

    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this.statusBarItem.text = "ClassScrubber";
    this.statusBarItem.command = "ClassScrubber.findUnusedClasses";
    this.statusBarItem.tooltip = "Find Unused Classes";
    this.statusBarItem.show();
  }

  public set ignoreFiles(value: string[]) {
    this._ignoreFiles = value;
  }

  public findUnusedClasses(): string[] {
    const unusedClasses: string[] = [];
    const checker = this.program.getTypeChecker();
    const sourceFiles = this.program.getSourceFiles();

    sourceFiles.forEach((sourceFile: ts.SourceFile) => {
      if (this._ignoreFiles.some(ignoreFile => sourceFile.fileName.includes(ignoreFile))) {
        return;
      }

      const classDeclarations = getDescendantsOfKind(sourceFile, ts.SyntaxKind.ClassDeclaration);

      for (const classDeclaration of classDeclarations as ts.ClassDeclaration[]) {
        const symbol = checker.getSymbolAtLocation(classDeclaration);
        if (symbol && !symbol.declarations?.some(d => checker.getSymbolAtLocation(d) === symbol)) {
          unusedClasses.push(classDeclaration.name?.getText() ?? '');
        }
      }
    });

    return unusedClasses;
  }

  public removeUnusedClasses(): void {
    const checker = this.program.getTypeChecker();
    const sourceFiles = this.program.getSourceFiles();

    sourceFiles.forEach(sourceFile => {
      if (this._ignoreFiles.some(ignoreFile => sourceFile.fileName.includes(ignoreFile))) {
        return;
      }

      const classDeclarations = getDescendantsOfKind(sourceFile, ts.SyntaxKind.ClassDeclaration);

      for (const classDeclaration of classDeclarations) {
        const symbol = checker.getSymbolAtLocation(classDeclaration);
        if (symbol && !symbol.declarations?.some(d => checker.getSymbolAtLocation(d) === symbol)) {
          const node = classDeclaration.getFullText();
          const newSourceFileText = sourceFile.getFullText().replace(node, '');
          fs.writeFileSync(sourceFile.fileName, newSourceFileText);
        }
      }
    });
  }
}

function getDescendantsOfKind(node: ts.Node, kind: ts.SyntaxKind): ts.Node[] {
  const result: ts.Node[] = [];
  function visit(node: ts.Node) {
    if (node.kind === kind) {
      result.push(node);
    }
    node.getChildren().forEach(visit);
  }
  visit(node);
  return result;
}

let finder: ClassScrubber | undefined;

export function activate(context: vscode.ExtensionContext) {
  const configuration = vscode.workspace.getConfiguration('ClassScrubber');
  const ignoreFiles = configuration.get('ignoreFiles', []);

  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    finder = new ClassScrubber(vscode.workspace.workspaceFolders[0].uri.fsPath);
    finder.ignoreFiles = ignoreFiles;
  }

  let disposable = vscode.commands.registerCommand('ClassScrubber.findUnusedClasses', () => {
    if (finder) {
      const unusedClasses = finder.findUnusedClasses();

      const panel = vscode.window.createWebviewPanel(
        'ClassScrubber',
        'Unused Classes',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = `
      <html>
        <body>
          <h1>Unused Classes</h1>
          <ul>
            ${unusedClasses.map(className => `<li>${className}</li>`).join('')}
          </ul>
        </body>
      </html>
    `;
    } else {
      vscode.window.showErrorMessage('ClassScrubber: Workspace not found');
    }
  });

  context.subscriptions.push(disposable);

  context.subscriptions.push(vscode.commands.registerCommand('ClassScrubber.removeUnusedClasses', () => {
    if (finder) {
      finder.removeUnusedClasses();
      vscode.window.showInformationMessage('Unused classes have been removed.');
    } else {
      vscode.window.showErrorMessage('ClassScrubber: Workspace not found');
    }
  }));

  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('ClassScrubber.ignoreFiles')) {
      const ignoreFiles = configuration.get('ignoreFiles', []);
      if (finder) {
        finder.ignoreFiles = ignoreFiles;
      }
    }
  }));

  // Create GUI for setting ignore files
  let setIgnoreFilesDisposable = vscode.commands.registerCommand('ClassScrubber.setIgnoreFiles', async () => {
    const ignoreFiles = await vscode.window.showInputBox({
      placeHolder: 'Enter comma-separated file names to ignore (e.g., file1.ts, file2.ts)',
      prompt: 'Enter file names to ignore (comma-separated)'
    });

    if (ignoreFiles !== undefined && finder) {
      finder.ignoreFiles = ignoreFiles.split(',').map(file => file.trim());
    }
  });

  context.subscriptions.push(setIgnoreFilesDisposable);
}

export function deactivate(): void {
  if (finder) {
    // Perform cleanup or additional deactivation logic here
    finder = undefined;
  }
}
