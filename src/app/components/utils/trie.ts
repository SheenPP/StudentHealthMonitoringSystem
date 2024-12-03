export class TrieNode {
  children: Record<string, TrieNode>;
  isEndOfWord: boolean;
  data: any[];

  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.data = [];
  }
}

export class Trie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(key: string, record: any) {
    let node = this.root;
    for (const char of key) {  // Removed .toLowerCase() to keep original case
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.data.push(record);
  }

  search(prefix: string): any[] {
    let node = this.root;
    for (const char of prefix) {  // Removed .toLowerCase() to keep original case
      if (!node.children[char]) return [];
      node = node.children[char];
    }
    return this.collect(node);
  }

  private collect(node: TrieNode): any[] {
    let results: any[] = [...node.data];
    for (const child in node.children) {
      results = results.concat(this.collect(node.children[child]));
    }
    return results;
  }
}
