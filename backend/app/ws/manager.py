import json
from fastapi import WebSocket


class ConnectionManager:
    """In-process registry of active WebSocket connections, keyed by user_id.

    A user may hold several sockets at once (two tabs, phone + laptop), so each
    user maps to a set — a new connection must not evict an existing one.
    """

    def __init__(self):
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self._connections.setdefault(user_id, set()).add(ws)

    def disconnect(self, user_id: str, ws: WebSocket):
        conns = self._connections.get(user_id)
        if conns:
            conns.discard(ws)
            if not conns:
                self._connections.pop(user_id, None)

    async def send(self, user_id: str, event: str, data: dict):
        conns = self._connections.get(user_id)
        if not conns:
            return
        text = json.dumps({"event": event, "data": data})
        # NOSONAR — iterate a copy: disconnect() below mutates the set mid-loop.
        for ws in list(conns):
            try:
                await ws.send_text(text)
            except Exception:
                self.disconnect(user_id, ws)

    async def publish(self, user_id: str, event: str, data: dict):
        """Deliver an event to a connected user. Single-process — direct delivery.
        Swap the dict for Redis pub/sub before running multiple workers/instances."""
        await self.send(user_id, event, data)


manager = ConnectionManager()
