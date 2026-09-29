const USAGE = `valence-plugin <command>

  pack [folder] [--out dist]
      Packs the plugin in folder (default .) into <id>-<version>.vplugin.

  sign <file> [--key key.pem]
      Signs a file, writing <file>.sig. The key is read from --key or from the
      VALENCE_PLUGIN_SIGNING_KEY environment variable.

  keygen <key-id> [--out keys]
      Makes a new Ed25519 key pair: <key-id>.pem (private) and <key-id>.pub.pem.

  catalogue <packages-folder> --key-id <id> --package-url <template>
            --source-url <template> --icon-url <template> [--key key.pem] [--out site]
      Builds and signs catalogue.json from every .vplugin in the folder.
      Templates may use {id}, {version} and {file}.
`;

export { USAGE };
