import json
from fastapi import WebSocket


class ConnectionManager:
    """In-process registry of active WebSocket connections, keyed by user_id."""

    def __init__(self):
        self._connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self._connections[user_id] = ws

    def disconnect(self, user_id: str):
        self._connections.pop(user_id, None)

    async def send(self, user_id: str, event: str, data: dict):
        ws = self._connections.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps({"event": event, "data": data}))
            except Exception:
                self.disconnect(user_id)

    async def publish(self, user_id: str, event: str, data: dict):
        """Deliver an event to a connected user. Single-process — direct delivery."""
        await self.send(user_id, event, data)


manager = ConnectionManager()
