# backend/app/routes/delete.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import qdrant, supabase
from app.services.ingestion import neo4j_driver
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class DeleteRequest(BaseModel):
    repo_id: str

@router.delete("/delete")
async def delete_repo(payload: DeleteRequest):
    """
    Delete a repository and all its associated data from:
    - Supabase (repos table)
    - Qdrant (vector embeddings collection)
    - Neo4j (graph nodes and relationships)
    """
    try:
        # 1. Get repo details from Supabase
        repo = supabase.table("repos").select("*").eq("id", payload.repo_id).single().execute()

        if not repo.data:
            raise HTTPException(404, f"Repo not found with id: {payload.repo_id}")

        repo_data = repo.data
        collection_name = repo_data.get("qdrant_collection")

        logger.info(f"Deleting repo {payload.repo_id} with collection {collection_name}")

        # 2. Delete from Qdrant (if collection exists)
        if collection_name:
            try:
                qdrant.delete_collection(collection_name=collection_name)
                logger.info(f"Deleted Qdrant collection: {collection_name}")
            except Exception as e:
                logger.warning(f"Failed to delete Qdrant collection {collection_name}: {e}")
                # Continue even if Qdrant deletion fails

        # 3. Delete from Neo4j (all nodes and relationships for this repo)
        try:
            with neo4j_driver.session() as session:
                result = session.run("""
                    MATCH (n)
                    WHERE n.repo_id = $repo_id
                    DETACH DELETE n
                    RETURN count(n) as deleted_count
                """, repo_id=payload.repo_id)

                deleted_count = result.single()["deleted_count"]
                logger.info(f"Deleted {deleted_count} nodes from Neo4j for repo {payload.repo_id}")
        except Exception as e:
            logger.warning(f"Failed to delete from Neo4j: {e}")
            # Continue even if Neo4j deletion fails

        # 4. Delete from Supabase (do this last to ensure we have the data if other deletions fail)
        try:
            supabase.table("repos").delete().eq("id", payload.repo_id).execute()
            logger.info(f"Deleted repo {payload.repo_id} from Supabase")
        except Exception as e:
            logger.error(f"Failed to delete from Supabase: {e}")
            raise HTTPException(500, f"Failed to delete repo from database: {str(e)}")

        return {
            "success": True,
            "message": f"Successfully deleted repo {payload.repo_id} from all databases",
            "deleted_from": {
                "supabase": True,
                "qdrant": bool(collection_name),
                "neo4j": True
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting repo {payload.repo_id}: {e}", exc_info=True)
        raise HTTPException(500, f"Failed to delete repo: {str(e)}")
