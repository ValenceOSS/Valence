declare module '@react-native-cookies/cookies' {
  export function get(
    url: string,
    useWebKit?: boolean,
  ): Promise<Record<string, { name: string; value: string }>>;
}
