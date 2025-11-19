# backend/app/utils/tree_sitter.py
from tree_sitter_languages import get_parser
from neo4j import Driver
import os

def extract_structure(file_path: str, content: str, repo_id: str, driver: Driver):
    """
    Simple but working Tree-sitter → Neo4j extraction
    Creates one :File node per file + basic function/class nodes
    """
    ext = file_path.split('.')[-1].lower()
    lang_map = {
        "py": "python",
        "js": "javascript",
        "ts": "typescript",
        "tsx": "tsx",
        "jsx": "javascript",
        "go": "go",
        "java": "java",
        "rs": "rust"
    }

    if ext not in lang_map:
        return  # skip unsupported

    try:
        parser = get_parser(lang_map[ext])
        tree = parser.parse(content.encode())

        with driver.session() as session:
            # Create file node
            session.run("""
                MERGE (f:File {path: $path, repo_id: $repo_id})
                SET f.language = $lang, f.loc = $loc
            """, path=file_path, repo_id=repo_id, lang=ext, loc=len(content.splitlines()))

            # Very simple: just count functions (you'll make this beautiful later)
            query = None
            if ext == "py":
                query = "(function_definition name: (identifier) @func.name)"
            elif ext in ["js", "ts", "ts", "tsx", "jsx"]:
                query = "(function_declaration name: (identifier) @func.name)"

            if query:
                language = parser.language
                q = language.query(query)
                captures = q.captures(tree.root_node)
                func_names = [node.text.decode() for _, node in captures if _ == "func.name"]

                for name in func_names:
                    session.run("""
                        MATCH (f:File {path: $path, repo_id: $repo_id})
                        MERGE (func:Function {name: $name, file_path: $path})
                        MERGE (f)-[:CONTAINS]->(func)
                    """, path=file_path, repo_id=repo_id, name=name)

    except Exception as e:
        print(f"Tree-sitter failed on {file_path}: {e}")
        # Still create file node even if parsing fails
        with driver.session() as session:
            session.run("""
                MERGE (f:File {path: $path, repo_id: $repo_id})
                SET f.language = $lang, f.parse_error = true
            """, path=file_path, repo_id=repo_id, lang=ext)