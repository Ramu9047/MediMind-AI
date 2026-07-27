import logging
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

logger = logging.getLogger("medimind")

class Database:
    client: AsyncIOMotorClient = None
    db = None
    is_connected: bool = False

db_wrapper = Database()

async def connect_to_mongo():
    try:
        db_wrapper.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Test connection
        await db_wrapper.client.admin.command('ping')
        db_wrapper.db = db_wrapper.client[settings.DATABASE_NAME]
        db_wrapper.is_connected = True
        logger.info(f"Connected to MongoDB database: {settings.DATABASE_NAME}")
    except Exception as e:
        logger.warning(f"MongoDB connection failed: {e}. Operating with in-memory state store for demonstration.")
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

class InMemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self.docs = []

    async def insert_one(self, doc: dict):
        if "_id" not in doc:
            doc["_id"] = str(len(self.docs) + 1)
        self.docs.append(doc)
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
            return True
        return False

    async def count_documents(self, query: dict = None):
        if not query:
            return len(self.docs)
        return len([d for d in self.docs if all(d.get(k) == v for k, v in query.items())])

class InMemoryCursor:
    def __init__(self, docs: list):
        self.docs = docs

    async def to_list(self, length: int = 100):
        return self.docs[:length]

    def sort(self, key_or_list, direction=None):
        return self

class InMemoryDatabase:
    def __init__(self):
        self.collections = {}

    def __getitem__(self, name: str):
        if name not in self.collections:
            self.collections[name] = InMemoryCollection(name)
        return self.collections[name]
