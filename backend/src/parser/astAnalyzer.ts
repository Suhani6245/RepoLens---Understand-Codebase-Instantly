import Parser from "web-tree-sitter";

export interface ExtractedFunction {
  name: string;
  paramCount: number;
}

export interface AstAnalysis {
  imports: string[];
  exports: string[];
  functions: ExtractedFunction[];
}

function stripQuotes(text: string): string {
  return text.replace(/^["'`]|["'`]$/g, "");
}

function analyzeJsTs(root: Parser.SyntaxNode): AstAnalysis {
  const imports = new Set<string>();
  const exports = new Set<string>();
  const functions: ExtractedFunction[] = [];

  // import "x"; import y from "x"; export { a } from "x";
  for (const node of root.descendantsOfType([
    "import_statement",
    "export_statement",
  ])) {
    const source = node.childForFieldName("source");
    if (source) imports.add(stripQuotes(source.text));
  }

  // require("x") / dynamic import("x")
  for (const node of root.descendantsOfType("call_expression")) {
    const callee = node.childForFieldName("function");
    const isRequire = callee?.type === "identifier" && callee.text === "require";
    const isDynamicImport = callee?.type === "import";
    if (isRequire || isDynamicImport) {
      const args = node.childForFieldName("arguments");
      const firstArg = args?.namedChild(0);
      if (firstArg?.type === "string") {
        imports.add(stripQuotes(firstArg.text));
      }
    }
  }

  // export function foo() {}, export class Foo {}, export const x = ...,
  // export default ...
  for (const node of root.descendantsOfType("export_statement")) {
    const isDefault = node.children.some((c) => c.type === "default");
    if (isDefault) {
      exports.add("default");
      continue;
    }
    const declaration = node.namedChildren.find((c) =>
      [
        "function_declaration",
        "class_declaration",
        "lexical_declaration",
        "variable_declaration",
      ].includes(c.type)
    );
    if (!declaration) continue;

    if (declaration.type === "function_declaration" || declaration.type === "class_declaration") {
      const name = declaration.childForFieldName("name");
      if (name) exports.add(name.text);
    } else {
      for (const declarator of declaration.descendantsOfType("variable_declarator")) {
        const name = declarator.childForFieldName("name");
        if (name) exports.add(name.text);
      }
    }
  }

  // module.exports.foo = ... / exports.foo = ...
  for (const node of root.descendantsOfType("assignment_expression")) {
    const left = node.childForFieldName("left");
    if (left?.type === "member_expression" && /^(module\.exports|exports)\./.test(left.text)) {
      exports.add(left.text.split(".").pop() ?? left.text);
    }
  }

  // function declarations (top-level and nested) + arrow functions bound to a name
  for (const node of root.descendantsOfType("function_declaration")) {
    const name = node.childForFieldName("name");
    const params = node.childForFieldName("parameters");
    functions.push({
      name: name?.text ?? "(anonymous)",
      paramCount: params?.namedChildCount ?? 0,
    });
  }
  for (const node of root.descendantsOfType("variable_declarator")) {
    const value = node.childForFieldName("value");
    if (value?.type === "arrow_function" || value?.type === "function_expression") {
      const name = node.childForFieldName("name");
      const params = value.childForFieldName("parameters");
      functions.push({
        name: name?.text ?? "(anonymous)",
        paramCount: params?.namedChildCount ?? 0,
      });
    }
  }

  return {
    imports: Array.from(imports),
    exports: Array.from(exports),
    functions,
  };
}

function analyzePython(root: Parser.SyntaxNode): AstAnalysis {
  const imports = new Set<string>();
  const functions: ExtractedFunction[] = [];

  for (const node of root.descendantsOfType(["import_statement", "import_from_statement"])) {
    for (const dotted of node.descendantsOfType(["dotted_name", "relative_import"])) {
      imports.add(dotted.text);
    }
  }

  for (const node of root.descendantsOfType("function_definition")) {
    const name = node.childForFieldName("name");
    const params = node.childForFieldName("parameters");
    functions.push({
      name: name?.text ?? "(anonymous)",
      paramCount: params?.namedChildCount ?? 0,
    });
  }

  // Python has no formal export list — every top-level, non-underscore-
  // prefixed function/class is effectively public.
  const exports = functions
    .map((f) => f.name)
    .filter((name) => !name.startsWith("_"));

  return { imports: Array.from(imports), exports, functions };
}

/**
 * Runs the appropriate language-specific extraction over a parsed AST.
 * Returns null for languages without a dedicated analyzer, so the caller
 * can fall back to the regex-based extractor.
 */
export function analyzeTree(tree: Parser.Tree, language: string): AstAnalysis | null {
  if (language === "TypeScript" || language === "JavaScript") {
    return analyzeJsTs(tree.rootNode);
  }
  if (language === "Python") {
    return analyzePython(tree.rootNode);
  }
  return null;
}
