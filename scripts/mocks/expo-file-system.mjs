export const Paths = {
  cache: 'mock://cache',
  document: 'mock://document',
};

const mockFileStore = new Map();

export class File {
  constructor(...paths) {
    this.uri = paths.map((p) => (typeof p === 'object' && p?.uri ? p.uri : String(p))).join('/');
    this.exists = mockFileStore.has(this.uri);
    this._content = mockFileStore.get(this.uri) || '';
  }
  create(options) {
    this.exists = true;
    if (!mockFileStore.has(this.uri) || options?.overwrite) {
      mockFileStore.set(this.uri, this._content);
    }
  }
  delete() {
    this.exists = false;
    this._content = '';
    mockFileStore.delete(this.uri);
  }
  write(content) {
    this.exists = true;
    this._content = String(content);
    mockFileStore.set(this.uri, this._content);
  }
  async text() {
    return mockFileStore.get(this.uri) ?? this._content;
  }
  textSync() {
    return mockFileStore.get(this.uri) ?? this._content;
  }
}

