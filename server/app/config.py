import os
from supabase import create_client, Client
import voyageai
from qdrant_client import QdrantClient
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

vo = voyageai.Client(api_key=os.getenv("VOYAGE_API_KEY"))

qdrant = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

neo4j_driver = GraphDatabase.driver(
    os.getenv("NEO4J_URI"),
    auth=("neo4j", os.getenv("NEO4J_PASSWORD"))
)

github_token = os.getenv("GITHUB_TOKEN", "")