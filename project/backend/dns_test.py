import socket
try:
    print("Resolving via Python socket...")
    result = socket.getaddrinfo("api-inference.huggingface.co", 443)
    print("SUCCESS:", result[0])
except Exception as e:
    print("FAILED:", type(e).__name__, e)
