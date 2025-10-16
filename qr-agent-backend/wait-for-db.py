import socket
import time
import os

# Get DB host and port from environment variables, with defaults
host = os.environ.get("DB_HOST", "localhost")
port = int(os.environ.get("DB_PORT", 5432))

print(f"Waiting for database at {host}:{port}...")

while True:
    try:
        # Try to create a connection
        with socket.create_connection((host, port), timeout=5):
            print("Database is ready!")
            break
    except (socket.timeout, ConnectionRefusedError, OSError):
        print("Database isn't ready yet. Waiting...")
        time.sleep(2)
