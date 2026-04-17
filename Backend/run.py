"""
Point d'entrée local — contourne l'incompatibilité asyncpg + ProactorEventLoop (Windows).
On crée le SelectorEventLoop avant que uvicorn ne puisse en créer un autre.
"""
import asyncio
import sys

# DOIT être avant tout import uvicorn / fastapi
if sys.platform == "win32":
    # asyncio.run() crée toujours un nouveau loop → on bypasse en utilisant
    # un SelectorEventLoop pré-créé + run_until_complete()
    _loop = asyncio.SelectorEventLoop()
    asyncio.set_event_loop(_loop)

import uvicorn

if __name__ == "__main__":
    config = uvicorn.Config("main:app", host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)

    if sys.platform == "win32":
        loop = asyncio.get_event_loop()
        try:
            loop.run_until_complete(server.serve())
        finally:
            loop.close()
    else:
        asyncio.run(server.serve())
