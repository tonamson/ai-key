FROM decolua/9router:latest
RUN (apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*) 2>/dev/null \
 || apk add --no-cache python3 py3-pip
RUN pip3 install --break-system-packages --prefer-binary "headroom-ai[proxy]" 2>/dev/null \
 || pip3 install --prefer-binary "headroom-ai[proxy]"
COPY entrypoint.sh /custom-entrypoint.sh
RUN chmod +x /custom-entrypoint.sh
ENTRYPOINT ["/custom-entrypoint.sh"]
