import { VALENCE_REPOSITORY_URL } from '@ValenceCore/project/VALENCE_REPOSITORY_URL';

const SERVER_COMMANDS = [
  'mkdir -p ~/valence && cd ~/valence',
  `curl -fsSL -o compose.yaml ${VALENCE_REPOSITORY_URL}/releases/latest/download/compose.yaml`,
  'test -e .env || (umask 077; cat > .env) <<EOF',
  "POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')",
  'BETTER_AUTH_SECRET=$(openssl rand -base64 48)',
  'PUBLIC_URL=http://localhost:8420',
  'MEDIA_PATH=/path/to/your/media',
  'EOF',
  'nano .env',
  'docker compose up -d',
].join('\n');

export { SERVER_COMMANDS };
