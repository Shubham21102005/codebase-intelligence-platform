from app.config import supabase, vo, qdrant, neo4j_driver, github_token
from uuid import UUID
import tempfile
import git
from tqdm.asyncio import tqdm_asyncio
from app.utils.tree_sitter import extract_structure
import asyncio

async def ingest_repo(repo_id: UUID):
    try:
        repo = supabase.table("repos").select("*").eq("id", str(repo_id)).single().execute().data

        collection_name = f"repo_{repo_id}"

        qdrant.recreate_collection(
            collection_name=collection_name,
            vectors_config={"size": 1024, "distance": "Cosine"}
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            clone_url = f"https://{github_token}@github.com/{repo['owner']}/{repo['repo']}.git"
            git.Repo.clone_from(clone_url, tmpdir, depth=1, branch=repo.get("branch", "main"))

            files = []
            for root, _, fs in os.walk(tmpdir):
                for f in fs:
                    if f.split(".")[-1] in ["py", "js", "ts", "tsx", "jsx", "go", "java", "rs"]:
                        files.append(os.path.join(root, f))

            for path in tqdm_asyncio(files, desc="Processing"):
                rel = os.path.relpath(path, tmpdir)
                content = open(path, 'r', encoding='utf-8', errors='ignore').read()

                # Vector (voyage-code-2)
                chunks = [content[i:i+800] for i in range(0, len(content), 600)]
                if chunks:
                    embeds = vo.embed(chunks, model="voyage-code-2").embeddings
                    points = [ 
                        # ... same PointStruct code as before
                    ]
                    qdrant.upsert(collection_name, points)

                # Graph (Tree-sitter → Neo4j)
                extract_structure(rel, content, str(repo_id), neo4j_driver)

        supabase.table("repos").update({
            "status": "ready",
            "qdrant_collection": collection_name
        }).eq("id", str(repo_id)).execute()

    except Exception as e:
        supabase.table("repos").update({
            "status": "error",
            "error_message": str(e)[:500]
        }).eq("id", str(repo_id)).execute()
        raise