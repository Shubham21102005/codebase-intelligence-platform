# backend/app/utils/tree_sitter.py
from tree_sitter_languages import get_parser
from neo4j import Driver
import re

QUERIES = {
    "python": {
        "function": "(function_definition name: (identifier) @name) @def",
        "class": "(class_definition name: (identifier) @name) @def",
        "call": "(call function: (identifier) @name) @call",
        "import": "(import_statement module: (dotted_name) @name)",
        "import_from": "(import_from_statement module: (dotted_name) @module name: (identifier) @name)"
    },
    "javascript": {
        "function": "(function_declaration name: (identifier) @name) @def",
        "class": "(class_declaration name: (identifier) @name) @def",
        "call": "(call_expression function: (identifier) @name) @call",
        "import": "(import_statement source: (string) @source)",
        "export": "(export_statement declaration: (_) @decl)"
    },
    # Add typescript, go, java later if needed
}

def extract_structure(file_path: str, content: str, repo_id: str, driver: Driver):
    ext = file_path.split('.')[-1].lower()
    lang_map = {"py": "python", "js": "javascript", "ts": "typescript", "tsx": "tsx"}
    if ext not in lang_map:
        return

    try:
        parser = get_parser(lang_map[ext])
        tree = parser.parse(content.encode())
        language = parser.language
    except Exception as e:
        # Skip files that fail to parse
        print(f"Warning: Failed to parse {file_path}: {e}")
        return

    lang_name = lang_map[ext]
    queries = QUERIES.get(lang_name, {})
    with driver.session() as session:
        # File node
        session.run("MERGE (f:File {path: $path, repo_id: $repo_id}) SET f.language = $lang",
                    path=file_path, repo_id=repo_id, lang=ext)

        for kind, query_str in queries.items():
            if not query_str:
                continue
            query = language.query(query_str)
            captures = query.captures(tree.root_node)

            for node, tag in captures:
                text = node.text.decode()
                if tag == "name" or tag == "source" or tag == "module":
                    name = text
                    if kind == "function":
                        session.run("""
                            MATCH (f:File {path: $path, repo_id: $repo_id})
                            MERGE (func:Function {name: $name, file_path: $path})
                            MERGE (f)-[:CONTAINS]->(func)
                        """, path=file_path, repo_id=repo_id, name=name)
                    elif kind == "class":
                        session.run("""
                            MATCH (f:File {path: $path, repo_id: $repo_id})
                            MERGE (cls:Class {name: $name, file_path: $path})
                            MERGE (f)-[:CONTAINS]->(cls)
                        """, path=file_path, repo_id=repo_id, name=name)
                    elif kind == "call":
                        session.run("""
                            MATCH (f:File {path: $path, repo_id: $repo_id})
                            MERGE (called:Function {name: $name})
                            MERGE (f)-[:CALLS]->(called)
                        """, path=file_path, repo_id=repo_id, name=name)