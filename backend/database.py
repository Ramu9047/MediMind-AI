import logging
import os
import json
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

logger = logging.getLogger("medimind")

STORE_FILE_PATH = os.path.join(os.path.dirname(__file__), "data", "in_memory_store.json")

class Database:
    client: AsyncIOMotorClient = None
    db = None
    is_connected: bool = False

db_wrapper = Database()

async def connect_to_mongo():
    try:
        db_wrapper.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        await db_wrapper.client.admin.command('ping')
        db_wrapper.db = db_wrapper.client[settings.DATABASE_NAME]
        db_wrapper.is_connected = True
        logger.info(f"Connected to MongoDB database: {settings.DATABASE_NAME}")
    except Exception as e:
        logger.warning(f"MongoDB connection failed: {e}. Operating with persistent in-memory file store for demonstration.")
        db_wrapper.is_connected = False
        db_wrapper.db = InMemoryDatabase()

async def close_mongo_connection():
    if db_wrapper.client:
        db_wrapper.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    if db_wrapper.db is None:
        db_wrapper.db = InMemoryDatabase()
    return db_wrapper.db

class InMemoryCursor:
    def __init__(self, docs: list):
        self.docs = list(docs)

    async def to_list(self, length: int = 100):
        return self.docs[:length]

    def limit(self, count: int):
        return InMemoryCursor(self.docs[:count])

    def sort(self, key_or_list, direction=1):
        if not self.docs:
            return self

        key = None
        reverse = False

        if isinstance(key_or_list, str):
            key = key_or_list
            reverse = (direction == -1)
        elif isinstance(key_or_list, list) and len(key_or_list) > 0:
            key = key_or_list[0][0]
            reverse = (key_or_list[0][1] == -1)
        else:
            return self

        def get_sort_key(doc):
            val = doc.get(key)
            if val is None:
                return ""
            if hasattr(val, "isoformat"):
                return val.isoformat()
            return str(val)

        sorted_docs = sorted(self.docs, key=get_sort_key, reverse=reverse)
        return InMemoryCursor(sorted_docs)

class InMemoryCollection:
    def __init__(self, name: str, parent_db):
        self.name = name
        self.parent_db = parent_db
        self.docs = []

    def _persist(self):
        self.parent_db.save_to_disk()

    async def insert_one(self, doc: dict):
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        self.docs.append(doc)
        self._persist()
        class InsertResult:
            inserted_id = doc["_id"]
        return InsertResult()

    async def find_one(self, query: dict):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    def find(self, query: dict = None):
        if not query:
            return InMemoryCursor(self.docs)
        filtered = [d for d in self.docs if all(d.get(k) == v for k, v in query.items())]
        return InMemoryCursor(filtered)

    async def update_one(self, query: dict, update: dict):
        doc = await self.find_one(query)
        if doc and "$set" in update:
            doc.update(update["$set"])
            self._persist()
            return True
        return False

    async def delete_many(self, query: dict):
        initial_len = len(self.docs)
        if not query:
            self.docs = []
        else:
            self.docs = [d for d in self.docs if not all(d.get(k) == v for k, v in query.items())]
        deleted_count = initial_len - len(self.docs)
        self._persist()
        class DeleteResult:
            pass
        dr = DeleteResult()
        dr.deleted_count = deleted_count
        return dr

    async def count_documents(self, query: dict = None):
        if not query:
            return len(self.docs)
        return len([d for d in self.docs if all(d.get(k) == v for k, v in query.items())])

class InMemoryDatabase:
    def __init__(self):
        self.collections = {}
        self._load_from_disk()

    def _load_from_disk(self):
        if os.path.exists(STORE_FILE_PATH):
            try:
                with open(STORE_FILE_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for col_name, docs in data.items():
                        col = InMemoryCollection(col_name, self)
                        # Re-parse iso timestamps where applicable
                        for doc in docs:
                            for k, v in doc.items():
                                if isinstance(v, str) and (v.endswith("Z") or "T" in v):
                                    try:
                                        doc[k] = datetime.fromisoformat(v.replace("Z", "+00:00"))
                                    except Exception:
                                        pass
                        col.docs = docs
                        self.collections[col_name] = col
                logger.info(f"Loaded persistent in-memory store from {STORE_FILE_PATH}")
            except Exception as e:
                logger.warning(f"Could not load in-memory store from disk: {e}")

    def save_to_disk(self):
        try:
            os.makedirs(os.path.dirname(STORE_FILE_PATH), exist_ok=True)
            serializable_data = {}
            for col_name, col in self.collections.items():
                col_docs = []
                for doc in col.docs:
                    formatted_doc = {}
                    for k, v in doc.items():
                        if hasattr(v, "isoformat"):
                            formatted_doc[k] = v.isoformat()
                        else:
                            formatted_doc[k] = v
                    col_docs.append(formatted_doc)
                serializable_data[col_name] = col_docs

            with open(STORE_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(serializable_data, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save in-memory store to disk: {e}")

    def __getitem__(self, name: str):
        if name not in self.collections:
            self.collections[name] = InMemoryCollection(name, self)
        return self.collections[name]
