from app.config import supabase, vo, qdrant, neo4j_driver, github_token
from uuid import UUID
import tempfile #create temporary directories and then auto-delete it
import git 
from tqdm.asyncio import tqdm_asyncio #shows progress bar in terminal, can be removed while deploying
from app.utils.tree_sitter import extract_structure
from qdrant_client.http.models import PointStruct
import asyncio
import os
import hashlib
import logging
import time
from voyageai.error import RateLimitError
logger = logging.getLogger(__name__)


def embed_with_retry(texts, model="voyage-code-2", max_retries=5): 
    """
    Embed texts with exponential backoff retry logic for rate limits.
    """

    for attempt in range(max_retries):
        try:
            return vo.embed(texts, model=model).embeddings
        except RateLimitError as e:
            if attempt == max_retries - 1:
                logger.error(f"Max retries reached for embedding. Error: {e}")
                raise

            # Exponential backoff: 2^attempt seconds (2, 4, 8, 16, 32...)
            wait_time = 2 ** (attempt + 1)
            logger.warning(f"Rate limit hit. Retrying in {wait_time} seconds... (attempt {attempt + 1}/{max_retries})")
            time.sleep(wait_time)
        except Exception as e:
            logger.error(f"Unexpected error during embedding: {e}")
            raise

    raise Exception("Failed to embed after all retries")

async def ingest_repo(repo_id: UUID):
    try:
        repo = supabase.table("repos").select("*").eq("id", str(repo_id)).single().execute().data #fetches repo info from supabase

        collection_name = f"repo_{repo_id}"

        qdrant.recreate_collection( # creates new collection in qdrant if already exists, recreates it(deletes old one)
            collection_name=collection_name,
            vectors_config={"size": 1536, "distance": "Cosine"}
        )

        # Directories to skip during analysis
        EXCLUDED_DIRS = {
            "node_modules",
            "venv",
            ".venv",
            "env",
            ".env",
            "__pycache__",
            ".git",
            ".svn",
            ".hg",
            "dist",
            "build",
            ".next",
            ".nuxt",
            "target",
            "vendor",
            ".gradle",
            ".idea",
            ".vscode",
            "coverage",
            ".pytest_cache",
            ".mypy_cache",
            ".tox",
            "site-packages",
            "bower_components",
            "jspm_packages",
        }

        with tempfile.TemporaryDirectory() as tmpdir: #creates temporary directory
            clone_url = f"https://{github_token}@github.com/{repo['owner']}/{repo['repo']}.git"
            git.Repo.clone_from(clone_url, tmpdir, depth=1, branch=repo.get("branch", "main")) #depth= 1: clones only latest commit

            files = []
            for root, _, fs in os.walk(tmpdir):
                # Skip excluded directories
                dir_parts = os.path.normpath(root).split(os.sep) #turns folder name to list of strings
                if any(excluded in dir_parts for excluded in EXCLUDED_DIRS):
                    continue

                for f in fs:
                    if f.split(".")[-1] in ["py", "js", "ts", "tsx", "jsx", "go", "java", "rs"]:
                        files.append(os.path.join(root, f))

            for path in tqdm_asyncio(files, desc="Processing"):
                rel = os.path.relpath(path, tmpdir)
                content = open(path, 'r', encoding='utf-8', errors='ignore').read()

                if not content.strip():
                    continue  # skip empty files

                # Chunk with overlap
                chunks = [content[i:i+800] for i in range(0, len(content), 600)]
                if not chunks:
                    continue

                # Combine chunks and full file content into a single batch for embedding
                all_texts = chunks + [content[:800]]
                all_embeds = embed_with_retry(all_texts)

                chunk_embeds = all_embeds[:len(chunks)]
                full_emb = all_embeds[-1]
                # Build points
                points = []
                for i, (chunk, emb) in enumerate(zip(chunks, chunk_embeds)):
                    # Generate UUID from file path and chunk index
                    point_id = hashlib.md5(f"{rel}#{i}".encode()).hexdigest()
                    points.append(
                        PointStruct(
                            id=point_id,
                            vector=emb,
                            payload={
                                "content": chunk,
                                "file_path": rel,
                                "repo_id": str(repo_id),
                                "type": "chunk",
                                "chunk_index": i
                            }
                        )
                    )

                # Full file point
                full_point_id = hashlib.md5(f"{rel}#FULL".encode()).hexdigest()
                points.append(
                    PointStruct(
                        id=full_point_id,
                        vector=full_emb,
                        payload={
                            "content": content,
                            "file_path": rel,
                            "repo_id": str(repo_id),
                            "type": "full_file"
                        }
                    )
                )

                qdrant.upsert(collection_name=collection_name, points=points)

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