"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
var ts = require("typescript");
var fs = require("fs");
var vscode = require("vscode");
var ClassScrubber = /** @class */ (function () {
    function ClassScrubber(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._ignoreFiles = [];
        var host = ts.createCompilerHost({ target: ts.ScriptTarget.ES5 });
        var configFile = ts.findConfigFile(this.workspaceRoot, ts.sys.fileExists, 'tsconfig.json');
        if (configFile) {
            var config = ts.readConfigFile(configFile, ts.sys.readFile);
            var sourceFiles = config.config.files;
            this.program = ts.createProgram(sourceFiles, {}, host);
        }
    }
    Object.defineProperty(ClassScrubber.prototype, "ignoreFiles", {
        set: function (value) {
            this._ignoreFiles = value;
        },
        enumerable: false,
        configurable: true
    });
    ClassScrubber.prototype.findUnusedClasses = function () {
        var _this = this;
        var unusedClasses = [];
        var checker = this.program.getTypeChecker();
        var sourceFiles = this.program.getSourceFiles();
        sourceFiles.forEach(function (sourceFile) {
            var _a, _b, _c;
            if (_this._ignoreFiles.some(function (ignoreFile) { return sourceFile.fileName.includes(ignoreFile); })) {
                return;
            }
            var classDeclarations = getDescendantsOfKind(sourceFile, ts.SyntaxKind.ClassDeclaration);
            var _loop_1 = function (classDeclaration) {
                var symbol = checker.getSymbolAtLocation(classDeclaration);
                if (symbol && !((_a = symbol.declarations) === null || _a === void 0 ? void 0 : _a.some(function (d) { return checker.getSymbolAtLocation(d) === symbol; }))) {
                    unusedClasses.push((_c = (_b = classDeclaration.name) === null || _b === void 0 ? void 0 : _b.getText()) !== null && _c !== void 0 ? _c : '');
                }
            };
            for (var _i = 0, _d = classDeclarations; _i < _d.length; _i++) {
                var classDeclaration = _d[_i];
                _loop_1(classDeclaration);
            }
        });
        return unusedClasses;
    };
    ClassScrubber.prototype.removeUnusedClasses = function () {
        var _this = this;
        var checker = this.program.getTypeChecker();
        var sourceFiles = this.program.getSourceFiles();
        sourceFiles.forEach(function (sourceFile) {
            var _a;
            if (_this._ignoreFiles.some(function (ignoreFile) { return sourceFile.fileName.includes(ignoreFile); })) {
                return;
            }
            var classDeclarations = getDescendantsOfKind(sourceFile, ts.SyntaxKind.ClassDeclaration);
            var _loop_2 = function (classDeclaration) {
                var symbol = checker.getSymbolAtLocation(classDeclaration);
                if (symbol && !((_a = symbol.declarations) === null || _a === void 0 ? void 0 : _a.some(function (d) { return checker.getSymbolAtLocation(d) === symbol; }))) {
                    var node = classDeclaration.getFullText();
                    var newSourceFileText = sourceFile.getFullText().replace(node, '');
                    fs.writeFileSync(sourceFile.fileName, newSourceFileText);
                }
            };
            for (var _i = 0, classDeclarations_1 = classDeclarations; _i < classDeclarations_1.length; _i++) {
                var classDeclaration = classDeclarations_1[_i];
                _loop_2(classDeclaration);
            }
        });
    };
    return ClassScrubber;
}());
function getDescendantsOfKind(node, kind) {
    var result = [];
    function visit(node) {
        if (node.kind === kind) {
            result.push(node);
        }
        node.getChildren().forEach(visit);
    }
    visit(node);
    return result;
}
function activate(context) {
    var configuration = vscode.workspace.getConfiguration('ClassScrubber');
    var ignoreFiles = configuration.get('ignoreFiles', []);
    var finder;
    if (vscode.workspace) {
        finder = new ClassScrubber(vscode.workspace.rootPath);
        finder.ignoreFiles = ignoreFiles;
    }
    var disposable = vscode.commands.registerCommand('ClassScrubber.findUnusedClasses', function () {
        if (finder) {
            var unusedClasses = finder.findUnusedClasses();
            // Display the results in a new VS Code view
            var panel = vscode.window.createWebviewPanel('ClassScrubber', 'Unused Classes', vscode.ViewColumn.One, {
                enableScripts: true,
            });
            panel.webview.html = "\n      <html>\n        <body>\n          <h1>Unused Classes</h1>\n          <ul>\n            ".concat(unusedClasses.map(function (className) { return "<li>".concat(className, "</li>"); }).join(''), "\n          </ul>\n        </body>\n      </html>\n    ");
        }
        else {
            vscode.window.showErrorMessage('ClassScrubber: Workspace not found');
        }
    });
    context.subscriptions.push(disposable);
    // Create a new command for removing unused classes
    context.subscriptions.push(vscode.commands.registerCommand('ClassScrubber.removeUnusedClasses', function () {
        if (finder) {
            finder.removeUnusedClasses();
            vscode.window.showInformationMessage('Unused classes have been removed.');
        }
        else {
            vscode.window.showErrorMessage('ClassScrubber: Workspace not found');
        }
    }));
    // Create a new configuration file for the extension
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(function (event) {
        if (event.affectsConfiguration('ClassScrubber.ignoreFiles')) {
            var ignoreFiles_1 = configuration.get('ignoreFiles', []);
            if (finder) {
                finder.ignoreFiles = ignoreFiles_1;
            }
        }
    }));
}
exports.activate = activate;
// Create a new command for removing unused classes
function deactivate() {
    var configuration = vscode.workspace.getConfiguration('ClassScrubber');
    configuration.update('ignoreFiles', [], vscode.ConfigurationTarget.Global);
}
exports.deactivate = deactivate;
