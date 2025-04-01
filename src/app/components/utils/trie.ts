// src/app/components/utils/trie.ts

export class TrieNode<T> {
  children: Record<string, TrieNode<T>>;
  isEndOfWord: boolean;
  data: T[];

  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.data = [];
  }
}

export class Trie<T> {
  root: TrieNode<T>;

  constructor() {
    this.root = new TrieNode<T>();
  }

  insert(key: string, record: T): void {
    key = key.toLowerCase().trim(); // Normalize input
    let node = this.root;

    for (const char of key) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode<T>();
      }
      node = node.children[char];
    }

    node.isEndOfWord = true;
    node.data.push(record);
  }

  search(prefix: string): T[] {
    prefix = prefix.toLowerCase().trim(); // Normalize search prefix
    let node = this.root;

    for (const char of prefix) {
      if (!node.children[char]) {
        return [];
      }
      node = node.children[char];
    }

    return this.collect(node);
  }

  private collect(node: TrieNode<T>): T[] {
    let results: T[] = [...node.data];

    for (const char in node.children) {
      results = results.concat(this.collect(node.children[char]));
    }

    return results;
  }
}
