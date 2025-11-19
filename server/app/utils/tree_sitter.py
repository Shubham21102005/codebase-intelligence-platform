# backend/app/utils/tree_sitter.py
"""
Tree-sitter based code structure extraction for Neo4j knowledge graph.

Supported languages:
- Python (.py): functions, classes, calls
- JavaScript/JSX (.js, .jsx): functions, classes, methods, arrow functions
- TypeScript (.ts, .tsx): functions, classes, methods, arrow functions
- Go (.go): functions, methods, types/structs/interfaces
- Java (.java): methods, classes, interfaces
- Rust (.rs): functions, structs, enums, traits, impl blocks

Extracts:
- File nodes with repo_id and language
- Function nodes (includes methods, arrow functions)
- Class nodes (includes interfaces, structs, enums, traits)
- CONTAINS relationships (File -> Function/Class)
"""
from tree_sitter import Language, Parser
from neo4j import Driver
import re
import logging

logger = logging.getLogger(__name__)

# Try to import tree-sitter languages
HAS_LANGUAGES = {}
try:
    import tree_sitter_python as tspython
    HAS_LANGUAGES['python'] = tspython
except ImportError:
    logger.debug("tree-sitter-python not found")

try:
    import tree_sitter_javascript as tsjavascript
    HAS_LANGUAGES['javascript'] = tsjavascript
except ImportError:
    logger.debug("tree-sitter-javascript not found")

try:
    import tree_sitter_typescript as tstypescript
    HAS_LANGUAGES['typescript'] = tstypescript
except ImportError:
    logger.debug("tree-sitter-typescript not found")

# Optional languages
try:
    import tree_sitter_go as tsgo
    HAS_LANGUAGES['go'] = tsgo
except ImportError:
    pass

try:
    import tree_sitter_java as tsjava
    HAS_LANGUAGES['java'] = tsjava
except ImportError:
    pass

try:
    import tree_sitter_rust as tsrust
    HAS_LANGUAGES['rust'] = tsrust
except ImportError:
    pass

def walk_tree(node):
    """Generator that yields all nodes in the tree"""
    yield node
    for child in node.children:
        yield from walk_tree(child)

def extract_structure(file_path: str, content: str, repo_id: str, driver: Driver):
    if not HAS_LANGUAGES:
        logger.debug("Skipping tree-sitter extraction - no language bindings available")
        return

    ext = file_path.split('.')[-1].lower()
    lang_map = {
        "py": "python",
        "js": "javascript",
        "jsx": "javascript",
        "ts": "typescript",
        "tsx": "typescript",
        "go": "go",
        "java": "java",
        "rs": "rust"
    }

    if ext not in lang_map:
        return

    lang_name = lang_map[ext]

    # Check if language is available
    if lang_name not in HAS_LANGUAGES:
        logger.debug(f"Skipping {file_path} - {lang_name} parser not available")
        return

    # Get the language
    try:
        lang_module = HAS_LANGUAGES[lang_name]

        if lang_name == "python":
            language = Language(lang_module.language())
        elif lang_name == "javascript":
            language = Language(lang_module.language())
        elif lang_name == "typescript":
            language = Language(lang_module.language_typescript())
        elif lang_name == "go":
            language = Language(lang_module.language())
        elif lang_name == "java":
            language = Language(lang_module.language())
        elif lang_name == "rust":
            language = Language(lang_module.language())
        else:
            logger.warning(f"Unsupported language: {lang_name}")
            return

        parser = Parser(language)
        tree = parser.parse(content.encode())
    except Exception as e:
        # Skip files that fail to parse
        logger.warning(f"Failed to parse {file_path}: {e}")
        return

    try:
        with driver.session() as session:
            # File node - now properly creating it
            logger.debug(f"Creating File node for {file_path} with repo_id {repo_id}")
            session.run("MERGE (f:File {path: $path, repo_id: $repo_id}) SET f.language = $lang",
                        path=file_path, repo_id=repo_id, lang=ext)

            # Extract functions and classes by walking the tree
            for node in walk_tree(tree.root_node):
                if lang_name == "python":
                    if node.type == "function_definition":
                        # Find the name child
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            func_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (func:Function {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(func)
                            """, path=file_path, repo_id=repo_id, name=func_name)

                    elif node.type == "class_definition":
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            class_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (cls:Class {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(cls)
                            """, path=file_path, repo_id=repo_id, name=class_name)

                    elif node.type == "call":
                        func_node = node.child_by_field_name("function")
                        if func_node and func_node.type == "identifier":
                            called_name = func_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (called:Function {name: $name, repo_id: $repo_id})
                                MERGE (f)-[:CALLS]->(called)
                            """, path=file_path, repo_id=repo_id, name=called_name)

                elif lang_name in ["javascript", "typescript"]:
                    if node.type in ["function_declaration", "function"]:
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            func_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (func:Function {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(func)
                            """, path=file_path, repo_id=repo_id, name=func_name)

                    elif node.type == "class_declaration":
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            class_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (cls:Class {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(cls)
                            """, path=file_path, repo_id=repo_id, name=class_name)

                    elif node.type == "method_definition":
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            method_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (func:Function {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(func)
                            """, path=file_path, repo_id=repo_id, name=method_name)

                    elif node.type == "variable_declarator":
                        # Capture const foo = () => {} and const foo = function() {}
                        name_node = node.child_by_field_name("name")
                        value_node = node.child_by_field_name("value")
                        if name_node and value_node and value_node.type in ["arrow_function", "function"]:
                            func_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (func:Function {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(func)
                            """, path=file_path, repo_id=repo_id, name=func_name)

                elif lang_name == "go":
                    if node.type == "function_declaration":
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            func_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (func:Function {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(func)
                            """, path=file_path, repo_id=repo_id, name=func_name)

                    elif node.type == "method_declaration":
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            method_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (func:Function {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(func)
                            """, path=file_path, repo_id=repo_id, name=method_name)

                    elif node.type == "type_declaration":
                        # Go structs and interfaces
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            type_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (cls:Class {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(cls)
                            """, path=file_path, repo_id=repo_id, name=type_name)

                elif lang_name == "java":
                    if node.type == "method_declaration":
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            method_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (func:Function {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(func)
                            """, path=file_path, repo_id=repo_id, name=method_name)

                    elif node.type == "class_declaration":
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            class_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (cls:Class {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(cls)
                            """, path=file_path, repo_id=repo_id, name=class_name)

                    elif node.type == "interface_declaration":
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            interface_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (cls:Class {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(cls)
                            """, path=file_path, repo_id=repo_id, name=interface_name)

                elif lang_name == "rust":
                    if node.type in ["function_item", "function_signature_item"]:
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            func_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (func:Function {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(func)
                            """, path=file_path, repo_id=repo_id, name=func_name)

                    elif node.type in ["struct_item", "enum_item", "trait_item"]:
                        name_node = node.child_by_field_name("name")
                        if name_node:
                            type_name = name_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (cls:Class {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(cls)
                            """, path=file_path, repo_id=repo_id, name=type_name)

                    elif node.type == "impl_item":
                        # Rust impl blocks
                        type_node = node.child_by_field_name("type")
                        if type_node:
                            impl_name = type_node.text.decode()
                            session.run("""
                                MATCH (f:File {path: $path, repo_id: $repo_id})
                                MERGE (cls:Class {name: $name, file_path: $path, repo_id: $repo_id})
                                MERGE (f)-[:CONTAINS]->(cls)
                            """, path=file_path, repo_id=repo_id, name=impl_name)

            logger.info(f"Successfully extracted structure for {file_path}")
    except Exception as e:
        logger.error(f"Neo4j error while processing {file_path}: {e}", exc_info=True)
        raise