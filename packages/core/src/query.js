export class QueryCollection extends Array {
    first() {
        return this.length > 0 ? this[0] : null;
    }

    last() {
        return this.length > 0 ? this[this.length - 1] : null;
    }

    all() {
        return [...this];
    }
}