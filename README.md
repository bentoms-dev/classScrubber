# ClassScrubber Extension for Visual Studio Code

The ClassScrubber extension helps you identify and remove unused classes from your TypeScript files in Visual Studio Code. It scans your TypeScript project and identifies classes that are not referenced anywhere in your codebase, allowing you to clean up your code and reduce file size.

## Features

- Find unused classes in your TypeScript project.
- Remove unused classes automatically or manually.

## Installation

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the square icon in the Sidebar.
3. Search for "ClassScrubber" and install the extension.

## Usage

### Find Unused Classes

To find unused classes in your TypeScript project:

1. Open the TypeScript file or the root folder of your TypeScript project in Visual Studio Code.
2. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on macOS).
3. Type "ClassScrubber: Find Unused Classes" and select it.
4. The extension will scan your project and display a list of unused classes in a new web view panel.

### Remove Unused Classes

To remove unused classes from your TypeScript files:

1. Follow the steps to find unused classes as described above.
2. After identifying unused classes, you have two options:
   - Manually remove the unused classes from your codebase based on the list displayed in the web view panel.
   - Use the "ClassScrubber: Remove Unused Classes" command to automatically remove unused classes from your codebase.

### Set Ignore Files

You can specify files to ignore during the scanning process:

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on macOS).
2. Type "ClassScrubber: Set Ignore Files" and select it.
3. Enter a comma-separated list of file names to ignore (e.g., file1.ts, file2.ts).

## Configuration

The extension supports the following configuration options:

- `ClassScrubber.ignoreFiles`: Specifies files to ignore during the scanning process. By default, no files are ignored.

You can configure these options in your VS Code settings (`settings.json`) or through the extension's settings in the UI.

## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvements, please open an issue on GitHub.

## License

This extension is licensed under the [MIT License](LICENSE).
