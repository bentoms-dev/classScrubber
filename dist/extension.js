"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBarItem.text = "ClassScrubber";
        this.statusBarItem.command = "ClassScrubber.findUnusedClasses";
        this.statusBarItem.tooltip = "Find Unused Classes";
        this.statusBarItem.show();
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
var finder;
function activate(context) {
    var _this = this;
    var configuration = vscode.workspace.getConfiguration('ClassScrubber');
    var ignoreFiles = configuration.get('ignoreFiles', []);
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        finder = new ClassScrubber(vscode.workspace.workspaceFolders[0].uri.fsPath);
        finder.ignoreFiles = ignoreFiles;
    }
    var disposable = vscode.commands.registerCommand('ClassScrubber.findUnusedClasses', function () {
        if (finder) {
            var unusedClasses = finder.findUnusedClasses();
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
    context.subscriptions.push(vscode.commands.registerCommand('ClassScrubber.removeUnusedClasses', function () {
        if (finder) {
            finder.removeUnusedClasses();
            vscode.window.showInformationMessage('Unused classes have been removed.');
        }
        else {
            vscode.window.showErrorMessage('ClassScrubber: Workspace not found');
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(function (event) {
        if (event.affectsConfiguration('ClassScrubber.ignoreFiles')) {
            var ignoreFiles_1 = configuration.get('ignoreFiles', []);
            if (finder) {
                finder.ignoreFiles = ignoreFiles_1;
            }
        }
    }));
    // Create GUI for setting ignore files
    var setIgnoreFilesDisposable = vscode.commands.registerCommand('ClassScrubber.setIgnoreFiles', function () { return __awaiter(_this, void 0, void 0, function () {
        var ignoreFiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, vscode.window.showInputBox({
                        placeHolder: 'Enter comma-separated file names to ignore (e.g., file1.ts, file2.ts)',
                        prompt: 'Enter file names to ignore (comma-separated)'
                    })];
                case 1:
                    ignoreFiles = _a.sent();
                    if (ignoreFiles !== undefined && finder) {
                        finder.ignoreFiles = ignoreFiles.split(',').map(function (file) { return file.trim(); });
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    context.subscriptions.push(setIgnoreFilesDisposable);
}
exports.activate = activate;
function deactivate() {
    if (finder) {
        // Perform cleanup or additional deactivation logic here
        finder = undefined;
    }
}
exports.deactivate = deactivate;
