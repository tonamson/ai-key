FROM decolua/9router:latest
RUN (apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*) 2>/dev/null \
 || apk add --no-cache python3 py3-pip
