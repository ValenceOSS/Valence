const SERVER_COMMANDS = [
  'mkdir -p ~/valence && cd ~/valence',
  'curl -fsSL -o compose.yaml https://github.com/ValenceOSS/Valence/releases/latest/download/compose.yaml',
  'curl -fsSL -o .env https://github.com/ValenceOSS/Valence/releases/latest/download/env.example',
  'nano .env',
  'docker compose up -d',
].join('\n');

export { SERVER_COMMANDS };
